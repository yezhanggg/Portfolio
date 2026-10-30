/*
 * QR Code generator library (JavaScript)
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/qr-code-generator-library
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

// Ported from typescript-javascript/qrcodegen.ts (github.com/nayuki/QR-Code-generator, fetched
// 2026-10-29) to a plain ES module: TypeScript types and namespaces removed, logic unchanged.
// Used at build time only (in .astro frontmatter); `qrMatrix()` at the bottom is a site helper.

/*---- QR Code symbol class ----*/

export class QrCode {
  /*-- Static factory functions (high level) --*/

  // Returns a QR Code representing the given Unicode text string at the given error correction level.
  static encodeText(text, ecl) {
    const segs = QrSegment.makeSegments(text);
    return QrCode.encodeSegments(segs, ecl);
  }

  // Returns a QR Code representing the given binary data (array of bytes) at the given error correction level.
  static encodeBinary(data, ecl) {
    const seg = QrSegment.makeBytes(data);
    return QrCode.encodeSegments([seg], ecl);
  }

  /*-- Static factory functions (mid level) --*/

  // Returns a QR Code representing the given segments with the given encoding parameters.
  // The smallest possible version within [minVersion, maxVersion] is chosen. Iff boostEcl is true,
  // the ECC level of the result may be higher than ecl if that does not increase the version.
  // mask is 0..7 to force that mask, or -1 to choose automatically.
  static encodeSegments(segs, ecl, minVersion = 1, maxVersion = 40, mask = -1, boostEcl = true) {
    if (!(QrCode.MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= QrCode.MAX_VERSION) || mask < -1 || mask > 7)
      throw new RangeError("Invalid value");

    // Find the minimal version number to use
    let version;
    let dataUsedBits;
    for (version = minVersion; ; version++) {
      const dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
      const usedBits = QrSegment.getTotalBits(segs, version);
      if (usedBits <= dataCapacityBits) {
        dataUsedBits = usedBits;
        break;
      }
      if (version >= maxVersion) throw new RangeError("Data too long");
    }

    // Increase the error correction level while the data still fits in the current version number
    for (const newEcl of [Ecc.MEDIUM, Ecc.QUARTILE, Ecc.HIGH]) {
      if (boostEcl && dataUsedBits <= QrCode.getNumDataCodewords(version, newEcl) * 8) ecl = newEcl;
    }

    // Concatenate all segments to create the data bit string
    const bb = [];
    for (const seg of segs) {
      appendBits(seg.mode.modeBits, 4, bb);
      appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);
      for (const b of seg.getData()) bb.push(b);
    }
    assert(bb.length == dataUsedBits);

    // Add terminator and pad up to a byte if applicable
    const dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
    assert(bb.length <= dataCapacityBits);
    appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
    appendBits(0, (8 - (bb.length % 8)) % 8, bb);
    assert(bb.length % 8 == 0);

    // Pad with alternating bytes until data capacity is reached
    for (let padByte = 0xec; bb.length < dataCapacityBits; padByte ^= 0xec ^ 0x11) appendBits(padByte, 8, bb);

    // Pack bits into bytes in big endian
    const dataCodewords = [];
    while (dataCodewords.length * 8 < bb.length) dataCodewords.push(0);
    bb.forEach((b, i) => (dataCodewords[i >>> 3] |= b << (7 - (i & 7))));

    return new QrCode(version, ecl, dataCodewords, mask);
  }

  /*-- Constructor (low level) --*/

  // version 1..40, errorCorrectionLevel an Ecc, dataCodewords an array of bytes, msk -1..7.
  constructor(version, errorCorrectionLevel, dataCodewords, msk) {
    this.version = version;
    this.errorCorrectionLevel = errorCorrectionLevel;
    // The modules of this QR Code (false = light, true = dark).
    this.modules = [];
    // Indicates function modules that are not subjected to masking. Discarded when constructor finishes.
    this.isFunction = [];

    if (version < QrCode.MIN_VERSION || version > QrCode.MAX_VERSION) throw new RangeError("Version value out of range");
    if (msk < -1 || msk > 7) throw new RangeError("Mask value out of range");
    this.size = version * 4 + 17;

    // Initialize both grids to be size*size arrays of Boolean false
    const row = [];
    for (let i = 0; i < this.size; i++) row.push(false);
    for (let i = 0; i < this.size; i++) {
      this.modules.push(row.slice());
      this.isFunction.push(row.slice());
    }

    // Compute ECC, draw modules
    this.drawFunctionPatterns();
    const allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords);

    // Do masking
    if (msk == -1) {
      let minPenalty = 1000000000;
      for (let i = 0; i < 8; i++) {
        this.applyMask(i);
        this.drawFormatBits(i);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          msk = i;
          minPenalty = penalty;
        }
        this.applyMask(i); // Undoes the mask due to XOR
      }
    }
    assert(0 <= msk && msk <= 7);
    this.mask = msk;
    this.applyMask(msk);
    this.drawFormatBits(msk);

    this.isFunction = [];
  }

  /*-- Accessor methods --*/

  // Returns the color of the module at (x, y): false for light, true for dark. Out of bounds is light.
  getModule(x, y) {
    return 0 <= x && x < this.size && 0 <= y && y < this.size && this.modules[y][x];
  }

  /*-- Private helper methods for constructor: Drawing function modules --*/

  drawFunctionPatterns() {
    // Draw horizontal and vertical timing patterns
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 == 0);
      this.setFunctionModule(i, 6, i % 2 == 0);
    }

    // Draw 3 finder patterns (all corners except bottom right; overwrites some timing modules)
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    // Draw numerous alignment patterns
    const alignPatPos = this.getAlignmentPatternPositions();
    const numAlign = alignPatPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        // Don't draw on the three finder corners
        if (!((i == 0 && j == 0) || (i == 0 && j == numAlign - 1) || (i == numAlign - 1 && j == 0)))
          this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
      }
    }

    // Draw configuration data
    this.drawFormatBits(0); // Dummy mask value; overwritten later in the constructor
    this.drawVersion();
  }

  drawFormatBits(mask) {
    // Calculate error correction code and pack bits
    const data = (this.errorCorrectionLevel.formatBits << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412; // uint15
    assert(bits >>> 15 == 0);

    // Draw first copy
    for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));

    // Draw second copy
    for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
    this.setFunctionModule(8, this.size - 8, true); // Always dark
  }

  drawVersion() {
    if (this.version < 7) return;

    // Calculate error correction code and pack bits
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem; // uint18
    assert(bits >>> 18 == 0);

    // Draw two copies
    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  }

  // Draws a 9*9 finder pattern including the border separator, centred at (x, y).
  drawFinderPattern(x, y) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy)); // Chebyshev/infinity norm
        const xx = x + dx;
        const yy = y + dy;
        if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size) this.setFunctionModule(xx, yy, dist != 2 && dist != 4);
      }
    }
  }

  // Draws a 5*5 alignment pattern centred at (x, y).
  drawAlignmentPattern(x, y) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) != 1);
    }
  }

  setFunctionModule(x, y, isDark) {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  /*-- Private helper methods for constructor: Codewords and masking --*/

  addEccAndInterleave(data) {
    const ver = this.version;
    const ecl = this.errorCorrectionLevel;
    if (data.length != QrCode.getNumDataCodewords(ver, ecl)) throw new RangeError("Invalid argument");

    // Calculate parameter numbers
    const numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    const blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
    const rawCodewords = Math.floor(QrCode.getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    // Split data into blocks and append ECC to each block
    const blocks = [];
    const rsDiv = QrCode.reedSolomonComputeDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      const ecc = QrCode.reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }

    // Interleave (not concatenate) the bytes from every block into a single sequence
    const result = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        // Skip the padding byte in short blocks
        if (i != shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
      });
    }
    assert(result.length == rawCodewords);
    return result;
  }

  drawCodewords(data) {
    if (data.length != Math.floor(QrCode.getNumRawDataModules(this.version) / 8)) throw new RangeError("Invalid argument");
    let i = 0; // Bit index into the data
    // Do the funny zigzag scan
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right == 6) right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) == 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
          // Remainder bits (0 to 7) were assigned light by the constructor and are left unchanged
        }
      }
    }
    assert(i == data.length * 8);
  }

  applyMask(mask) {
    if (mask < 0 || mask > 7) throw new RangeError("Mask value out of range");
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert;
        switch (mask) {
          case 0: invert = (x + y) % 2 == 0; break;
          case 1: invert = y % 2 == 0; break;
          case 2: invert = x % 3 == 0; break;
          case 3: invert = (x + y) % 3 == 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) == 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 == 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 == 0; break;
          default: throw new Error("Unreachable");
        }
        if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  getPenaltyScore() {
    let result = 0;

    // Adjacent modules in row having same color, and finder-like patterns
    for (let y = 0; y < this.size; y++) {
      let runColor = false;
      let runX = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < this.size; x++) {
        if (this.modules[y][x] == runColor) {
          runX++;
          if (runX == 5) result += QrCode.PENALTY_N1;
          else if (runX > 5) result++;
        } else {
          this.finderPenaltyAddHistory(runX, runHistory);
          if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * QrCode.PENALTY_N3;
          runColor = this.modules[y][x];
          runX = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * QrCode.PENALTY_N3;
    }
    // Adjacent modules in column having same color, and finder-like patterns
    for (let x = 0; x < this.size; x++) {
      let runColor = false;
      let runY = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < this.size; y++) {
        if (this.modules[y][x] == runColor) {
          runY++;
          if (runY == 5) result += QrCode.PENALTY_N1;
          else if (runY > 5) result++;
        } else {
          this.finderPenaltyAddHistory(runY, runHistory);
          if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * QrCode.PENALTY_N3;
          runColor = this.modules[y][x];
          runY = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * QrCode.PENALTY_N3;
    }

    // 2*2 blocks of modules having same color
    for (let y = 0; y < this.size - 1; y++) {
      for (let x = 0; x < this.size - 1; x++) {
        const color = this.modules[y][x];
        if (color == this.modules[y][x + 1] && color == this.modules[y + 1][x] && color == this.modules[y + 1][x + 1])
          result += QrCode.PENALTY_N2;
      }
    }

    // Balance of dark and light modules
    let dark = 0;
    for (const row of this.modules) dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
    const total = this.size * this.size;
    // Compute the smallest integer k >= 0 such that (45-5k)% <= dark/total <= (55+5k)%
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    assert(0 <= k && k <= 9);
    result += k * QrCode.PENALTY_N4;
    assert(0 <= result && result <= 2568888);
    return result;
  }

  /*-- Private helper functions --*/

  getAlignmentPatternPositions() {
    if (this.version == 1) return [];
    const numAlign = Math.floor(this.version / 7) + 2;
    const step = Math.floor((this.version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
    const result = [6];
    for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  }

  static getNumRawDataModules(ver) {
    if (ver < QrCode.MIN_VERSION || ver > QrCode.MAX_VERSION) throw new RangeError("Version number out of range");
    let result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    assert(208 <= result && result <= 29648);
    return result;
  }

  static getNumDataCodewords(ver, ecl) {
    return (
      Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
      QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] * QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver]
    );
  }

  static reedSolomonComputeDivisor(degree) {
    if (degree < 1 || degree > 255) throw new RangeError("Degree out of range");
    // Coefficients from highest to lowest power, excluding the leading term which is always 1.
    const result = [];
    for (let i = 0; i < degree - 1; i++) result.push(0);
    result.push(1); // Start off with the monomial x^0

    // Product (x - r^0) * (x - r^1) * ... * (x - r^{degree-1}), r = 0x02, in GF(2^8/0x11D).
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < result.length; j++) {
        result[j] = QrCode.reedSolomonMultiply(result[j], root);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      root = QrCode.reedSolomonMultiply(root, 0x02);
    }
    return result;
  }

  static reedSolomonComputeRemainder(data, divisor) {
    const result = divisor.map(() => 0);
    for (const b of data) {
      // Polynomial division
      const factor = b ^ result.shift();
      result.push(0);
      divisor.forEach((coef, i) => (result[i] ^= QrCode.reedSolomonMultiply(coef, factor)));
    }
    return result;
  }

  static reedSolomonMultiply(x, y) {
    if (x >>> 8 != 0 || y >>> 8 != 0) throw new RangeError("Byte out of range");
    // Russian peasant multiplication
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    assert(z >>> 8 == 0);
    return z;
  }

  finderPenaltyCountPatterns(runHistory) {
    const n = runHistory[1];
    assert(n <= this.size * 3);
    const core = n > 0 && runHistory[2] == n && runHistory[3] == n * 3 && runHistory[4] == n && runHistory[5] == n;
    return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
  }

  finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
    if (currentRunColor) {
      // Terminate dark run
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += this.size; // Add light border to final run
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  }

  finderPenaltyAddHistory(currentRunLength, runHistory) {
    if (runHistory[0] == 0) currentRunLength += this.size; // Add light border to initial run
    runHistory.pop();
    runHistory.unshift(currentRunLength);
  }
}

QrCode.MIN_VERSION = 1;
QrCode.MAX_VERSION = 40;

// For use in getPenaltyScore(), when evaluating which mask is best.
QrCode.PENALTY_N1 = 3;
QrCode.PENALTY_N2 = 3;
QrCode.PENALTY_N3 = 40;
QrCode.PENALTY_N4 = 10;

// prettier-ignore
QrCode.ECC_CODEWORDS_PER_BLOCK = [
  // Version: (index 0 is padding, set to an illegal value)
  //0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
  [-1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // Low
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // Medium
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // Quartile
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // High
];

// prettier-ignore
QrCode.NUM_ERROR_CORRECTION_BLOCKS = [
  // Version: (index 0 is padding, set to an illegal value)
  //0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],  // Low
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],  // Medium
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],  // Quartile
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],  // High
];

// Appends the given number of low-order bits of the given value to the given buffer.
// Requires 0 <= len <= 31 and 0 <= val < 2^len.
function appendBits(val, len, bb) {
  if (len < 0 || len > 31 || val >>> len != 0) throw new RangeError("Value out of range");
  for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
}

// Returns true iff the i'th bit of x is set to 1.
function getBit(x, i) {
  return ((x >>> i) & 1) != 0;
}

// Throws an exception if the given condition is false.
function assert(cond) {
  if (!cond) throw new Error("Assertion error");
}

/*---- Error correction level ----*/

export class Ecc {
  // ordinal 0..3; formatBits 0..3 (package-private)
  constructor(ordinal, formatBits) {
    this.ordinal = ordinal;
    this.formatBits = formatBits;
  }
}
Ecc.LOW = new Ecc(0, 1); // tolerates about  7% erroneous codewords
Ecc.MEDIUM = new Ecc(1, 0); // tolerates about 15% erroneous codewords
Ecc.QUARTILE = new Ecc(2, 3); // tolerates about 25% erroneous codewords
Ecc.HIGH = new Ecc(3, 2); // tolerates about 30% erroneous codewords
QrCode.Ecc = Ecc;

/*---- Data segment class ----*/

export class QrSegment {
  /*-- Static factory functions (mid level) --*/

  // A segment representing the given binary data (array of bytes) in byte mode.
  static makeBytes(data) {
    const bb = [];
    for (const b of data) appendBits(b, 8, bb);
    return new QrSegment(Mode.BYTE, data.length, bb);
  }

  // A segment representing the given string of decimal digits in numeric mode.
  static makeNumeric(digits) {
    if (!QrSegment.isNumeric(digits)) throw new RangeError("String contains non-numeric characters");
    const bb = [];
    for (let i = 0; i < digits.length; ) {
      // Consume up to 3 digits per iteration
      const n = Math.min(digits.length - i, 3);
      appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
      i += n;
    }
    return new QrSegment(Mode.NUMERIC, digits.length, bb);
  }

  // A segment representing the given text in alphanumeric mode
  // (0-9, A-Z uppercase, space, $ % * + - . / :).
  static makeAlphanumeric(text) {
    if (!QrSegment.isAlphanumeric(text)) throw new RangeError("String contains unencodable characters in alphanumeric mode");
    const bb = [];
    let i;
    for (i = 0; i + 2 <= text.length; i += 2) {
      // Process groups of 2
      let temp = QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
      temp += QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
      appendBits(temp, 11, bb);
    }
    if (i < text.length) appendBits(QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
    return new QrSegment(Mode.ALPHANUMERIC, text.length, bb);
  }

  // Zero or more segments representing the given Unicode text, picking the most compact single mode.
  static makeSegments(text) {
    if (text == "") return [];
    else if (QrSegment.isNumeric(text)) return [QrSegment.makeNumeric(text)];
    else if (QrSegment.isAlphanumeric(text)) return [QrSegment.makeAlphanumeric(text)];
    else return [QrSegment.makeBytes(QrSegment.toUtf8ByteArray(text))];
  }

  // A segment representing an Extended Channel Interpretation (ECI) designator.
  static makeEci(assignVal) {
    const bb = [];
    if (assignVal < 0) throw new RangeError("ECI assignment value out of range");
    else if (assignVal < 1 << 7) appendBits(assignVal, 8, bb);
    else if (assignVal < 1 << 14) {
      appendBits(0b10, 2, bb);
      appendBits(assignVal, 14, bb);
    } else if (assignVal < 1000000) {
      appendBits(0b110, 3, bb);
      appendBits(assignVal, 21, bb);
    } else throw new RangeError("ECI assignment value out of range");
    return new QrSegment(Mode.ECI, 0, bb);
  }

  static isNumeric(text) {
    return QrSegment.NUMERIC_REGEX.test(text);
  }

  static isAlphanumeric(text) {
    return QrSegment.ALPHANUMERIC_REGEX.test(text);
  }

  /*-- Constructor (low level) --*/

  constructor(mode, numChars, bitData) {
    if (numChars < 0) throw new RangeError("Invalid argument");
    this.mode = mode;
    this.numChars = numChars;
    this.bitData = bitData.slice(); // Make defensive copy
  }

  // Returns a new copy of the data bits of this segment.
  getData() {
    return this.bitData.slice();
  }

  // Number of bits needed to encode the given segments at the given version; Infinity if too long.
  static getTotalBits(segs, version) {
    let result = 0;
    for (const seg of segs) {
      const ccbits = seg.mode.numCharCountBits(version);
      if (seg.numChars >= 1 << ccbits) return Infinity;
      result += 4 + ccbits + seg.bitData.length;
    }
    return result;
  }

  static toUtf8ByteArray(str) {
    str = encodeURI(str);
    const result = [];
    for (let i = 0; i < str.length; i++) {
      if (str.charAt(i) != "%") result.push(str.charCodeAt(i));
      else {
        result.push(parseInt(str.substring(i + 1, i + 3), 16));
        i += 2;
      }
    }
    return result;
  }
}

QrSegment.NUMERIC_REGEX = /^[0-9]*$/;
QrSegment.ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
QrSegment.ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

/*---- Segment mode ----*/

export class Mode {
  constructor(modeBits, numBitsCharCount) {
    this.modeBits = modeBits; // uint4
    this.numBitsCharCount = numBitsCharCount; // character count bits for versions 1-9, 10-26, 27-40
  }
  numCharCountBits(ver) {
    return this.numBitsCharCount[Math.floor((ver + 7) / 17)];
  }
}
Mode.NUMERIC = new Mode(0x1, [10, 12, 14]);
Mode.ALPHANUMERIC = new Mode(0x2, [9, 11, 13]);
Mode.BYTE = new Mode(0x4, [8, 16, 16]);
Mode.KANJI = new Mode(0x8, [8, 10, 12]);
Mode.ECI = new Mode(0x7, [0, 0, 0]);
QrSegment.Mode = Mode;

/*---- Site helper (not part of Nayuki's library) ----*/

// Encodes `text` and returns the module grid as plain data for the page:
//   { size, version, ecl, mask, bits } where bits is a size*size string of "1" (dark) / "0" (light),
//   row-major from the top-left module. The quiet zone is NOT included.
// ecl: "L" | "M" | "Q" | "H" (the minimum; boostEcl may raise it at no size cost).
export function qrMatrix(text, { ecl = "Q", minVersion = 1, maxVersion = 40, mask = -1, boostEcl = true } = {}) {
  const level = { L: Ecc.LOW, M: Ecc.MEDIUM, Q: Ecc.QUARTILE, H: Ecc.HIGH }[ecl];
  if (!level) throw new RangeError(`Unknown error correction level ${ecl}`);
  const qr = QrCode.encodeSegments(QrSegment.makeSegments(text), level, minVersion, maxVersion, mask, boostEcl);
  let bits = "";
  for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) bits += qr.getModule(x, y) ? "1" : "0";
  return { size: qr.size, version: qr.version, ecl: "LMQH"[qr.errorCorrectionLevel.ordinal], mask: qr.mask, bits };
}
