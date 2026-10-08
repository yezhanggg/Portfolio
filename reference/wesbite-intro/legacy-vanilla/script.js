const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&*+";
const statValues = document.querySelectorAll(".stat .value");

const runScramble = (el, target, duration = 1300) => {
  const length = target.length;
  let frame = 0;
  const totalFrames = Math.max(20, Math.floor(duration / 33));

  const tick = () => {
    frame += 1;
    const progress = frame / totalFrames;
    const reveal = Math.floor(progress * length);
    let text = "";

    for (let i = 0; i < length; i += 1) {
      if (i < reveal) {
        text += target[i];
      } else if (target[i] === " ") {
        text += " ";
      } else {
        text += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      }
    }

    el.textContent = text;
    if (frame < totalFrames) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
    }
  };

  tick();
};

const cycleScramble = () => {
  statValues.forEach((el, index) => {
    const target = el.dataset.target || el.textContent || "";
    window.setTimeout(() => runScramble(el, target), index * 220);
  });
};

cycleScramble();
window.setInterval(cycleScramble, 5600);

const canvas = document.getElementById("particle-canvas");
const hero = document.querySelector(".hero");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && hero) {
  const ctx = canvas.getContext("2d");

  if (ctx) {
    let dpr = 1;
    let width = 0;
    let height = 0;
    let animationId = 0;
    let lastTime = 0;

    let centerX = 0;
    let centerY = 0;
    let rMax = 0;
    let rThroat = 0;
    let topBase = 0;
    let bottomBase = 0;
    let dip = 0;
    let throatHalf = 0;

    const stars = [];

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const rand = (min, max) => Math.random() * (max - min) + min;

    const topProfile = (radius, pulse, theta = 0, time = 0) => {
      const n = (radius - rThroat) / (rMax - rThroat);
      const innerWeight = Math.exp(-Math.pow(n * 2.1, 2));
      const wave = Math.sin(radius * 0.11 - time * 0.003 + theta * 1.8) * 3.2 * innerWeight;
      return topBase - dip * Math.exp(-Math.pow(n * 3.3, 2)) + pulse * 0.6 + wave;
    };

    const bottomProfile = (radius, pulse, theta = 0, time = 0) => {
      const n = (radius - rThroat) / (rMax - rThroat);
      const innerWeight = Math.exp(-Math.pow(n * 2.1, 2));
      const wave = Math.sin(radius * 0.11 - time * 0.003 + theta * 1.8 + Math.PI) * 3.2 * innerWeight;
      return bottomBase + dip * Math.exp(-Math.pow(n * 3.3, 2)) - pulse * 0.6 + wave;
    };

    const project = (x, y, z, time) => {
      const yaw = -0.9 + Math.sin(time * 0.00036) * 0.03;
      const pitch = -0.37 + Math.cos(time * 0.00028) * 0.018;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosX = Math.cos(pitch);
      const sinX = Math.sin(pitch);

      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const camera = 1180;
      const scale = camera / (camera + z2 + 420);

      return {
        x: centerX + x1 * scale,
        y: centerY + y1 * scale,
        scale,
      };
    };

    const drawParticlePath3D = (
      points,
      time,
      color,
      size = 1.2,
      spacing = 14,
      speed = 28
    ) => {
      if (points.length < 2) return;
      const projected = [];
      for (let i = 0; i < points.length; i += 1) {
        projected.push(project(points[i].x, points[i].y, points[i].z, time));
      }

      let carry = (time * 0.001 * speed) % spacing;

      for (let i = 1; i < points.length; i += 1) {
        const a = projected[i - 1];
        const b = projected[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const segLen = Math.hypot(dx, dy);
        if (segLen < 0.001) continue;

        while (carry <= segLen) {
          const t = carry / segLen;
          const x = a.x + dx * t;
          const y = a.y + dy * t;
          const localScale = a.scale + (b.scale - a.scale) * t;
          const radius = Math.max(0.6, size * localScale * 1.7);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          carry += spacing;
        }

        carry -= segLen;
      }
    };

    const buildStars = () => {
      stars.length = 0;
      const count = clamp(Math.floor((width * height) / 8500), 120, 260);
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          size: rand(0.5, 1.5),
          alpha: rand(0.05, 0.2),
          phase: rand(0, Math.PI * 2),
          twinkle: rand(0.0015, 0.006),
        });
      }
    };

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      centerX = width * 0.54;
      centerY = height * 0.64;
      rMax = Math.max(width, height) * 0.58;
      rThroat = rMax * 0.16;
      topBase = rMax * 0.2;
      bottomBase = -rMax * 0.2;
      dip = rMax * 0.13;
      throatHalf = rMax * 0.16;

      buildStars();
      lastTime = 0;
    };

    const drawStars = (time) => {
      for (const star of stars) {
        const alpha = star.alpha * (0.74 + 0.26 * Math.sin(time * star.twinkle + star.phase));
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(star.x * width, star.y * height, star.size, star.size);
      }
    };

    const drawSurface = (time, isTop, pulse) => {
      const ringSteps = 16;
      const angleSteps = 56;
      const radialSteps = 28;
      const lineColor = isTop ? "rgba(188,228,255,0.9)" : "rgba(150,198,250,0.75)";
      const spin = time * (isTop ? 0.00022 : -0.00018);

      for (let ring = 0; ring <= ringSteps; ring += 1) {
        const t = ring / ringSteps;
        const radius = rThroat + (rMax - rThroat) * t;
        const points = [];
        for (let i = 0; i <= angleSteps; i += 1) {
          const theta = (i / angleSteps) * Math.PI * 2 + spin;
          const y = isTop
            ? topProfile(radius, pulse, theta, time)
            : bottomProfile(radius, pulse, theta, time);
          points.push({
            x: Math.cos(theta) * radius,
            y,
            z: Math.sin(theta) * radius,
          });
        }
        drawParticlePath3D(
          points,
          time,
          lineColor,
          isTop ? 1.18 : 1.04,
          13,
          isTop ? 31 : -27
        );
      }

      for (let ray = 0; ray < radialSteps; ray += 1) {
        const theta = (ray / radialSteps) * Math.PI * 2 + spin;
        const points = [];
        for (let ring = 0; ring <= ringSteps; ring += 1) {
          const t = ring / ringSteps;
          const radius = rThroat + (rMax - rThroat) * t;
          const y = isTop
            ? topProfile(radius, pulse, theta, time)
            : bottomProfile(radius, pulse, theta, time);
          points.push({
            x: Math.cos(theta) * radius,
            y,
            z: Math.sin(theta) * radius,
          });
        }
        drawParticlePath3D(
          points,
          time,
          lineColor,
          isTop ? 1.1 : 1,
          14,
          isTop ? -24 : 20
        );
      }
    };

    const drawThroat = (time) => {
      const thetaSteps = 24;
      const verticalSteps = 12;
      const radius = rThroat * 0.88;
      const lineColor = "rgba(202,236,255,0.85)";

      for (let i = 0; i < thetaSteps; i += 1) {
        const theta = (i / thetaSteps) * Math.PI * 2;
        const points = [];
        for (let j = 0; j <= verticalSteps; j += 1) {
          const t = j / verticalSteps;
          const y = -throatHalf + t * throatHalf * 2;
          points.push({
            x: Math.cos(theta) * radius,
            y,
            z: Math.sin(theta) * radius,
          });
        }
        drawParticlePath3D(points, time, lineColor, 1.05, 11, 34);
      }

      for (let j = 0; j <= verticalSteps; j += 1) {
        const t = j / verticalSteps;
        const y = -throatHalf + t * throatHalf * 2;
        const points = [];
        for (let i = 0; i <= thetaSteps; i += 1) {
          const theta = (i / thetaSteps) * Math.PI * 2;
          points.push({
            x: Math.cos(theta) * radius,
            y,
            z: Math.sin(theta) * radius,
          });
        }
        drawParticlePath3D(points, time, lineColor, 0.98, 11.5, -31);
      }
    };

    const drawSideSheet = (time, pulse) => {
      const start = Math.PI * 0.58 + Math.sin(time * 0.00012) * 0.02;
      const end = Math.PI * 1.42 + Math.sin(time * 0.00012) * 0.02;
      const thetaSteps = 22;
      const verticalSteps = 10;
      const lineColor = "rgba(150,190,245,0.62)";
      const yTop = topProfile(rMax, pulse, 0, time);
      const yBottom = bottomProfile(rMax, pulse, 0, time);

      for (let i = 0; i <= thetaSteps; i += 1) {
        const t = i / thetaSteps;
        const theta = start + (end - start) * t;
        const points = [
          { x: Math.cos(theta) * rMax, y: yTop, z: Math.sin(theta) * rMax },
          { x: Math.cos(theta) * rMax, y: yBottom, z: Math.sin(theta) * rMax },
        ];
        drawParticlePath3D(points, time, lineColor, 0.95, 12.5, -25);
      }

      for (let j = 0; j <= verticalSteps; j += 1) {
        const t = j / verticalSteps;
        const y = yTop + (yBottom - yTop) * t;
        const points = [];
        for (let i = 0; i <= thetaSteps; i += 1) {
          const k = i / thetaSteps;
          const theta = start + (end - start) * k;
          points.push({
            x: Math.cos(theta) * rMax,
            y,
            z: Math.sin(theta) * rMax,
          });
        }
        drawParticlePath3D(points, time, lineColor, 0.92, 13, 23);
      }
    };

    const drawCoreGlow = (time, pulse) => {
      const topCenter = project(0, topProfile(rThroat, pulse, 0, time), 0, time);
      const radius = 64 * topCenter.scale + 30;
      const glow = ctx.createRadialGradient(topCenter.x, topCenter.y, 0, topCenter.x, topCenter.y, radius);
      glow.addColorStop(0, "rgba(170,235,255,0.92)");
      glow.addColorStop(0.22, "rgba(70,185,255,0.62)");
      glow.addColorStop(0.55, "rgba(35,105,255,0.24)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(topCenter.x, topCenter.y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (time) => {
      lastTime = time;
      const pulse = Math.sin(time * 0.0018) * 1.4 + Math.cos(time * 0.0009) * 0.8;

      ctx.clearRect(0, 0, width, height);
      drawStars(time);

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = "lighter";
      drawSurface(time, false, pulse);
      drawSideSheet(time, pulse);
      drawThroat(time);
      drawSurface(time, true, pulse);
      drawCoreGlow(time, pulse);
      ctx.globalCompositeOperation = "source-over";

      if (!reducedMotion) {
        animationId = requestAnimationFrame(frame);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    if (reducedMotion) {
      frame(0);
    } else {
      animationId = requestAnimationFrame(frame);
    }

    window.addEventListener("beforeunload", () => {
      if (animationId) cancelAnimationFrame(animationId);
    });
  }
}
