"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature as topoFeature, mesh as topoMesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { DS } from "@/data/dropship-assets";

export type GlobeMarker = {
  lat: number;
  lng: number;
  label: string;
  delay?: number;
};

type Props = {
  markers: readonly GlobeMarker[];
};

type WorldAtlas = Topology<{
  land: GeometryCollection;
  countries: GeometryCollection;
}>;

/**
 * Dropship-style half-globe: Three.js sphere + world-atlas land texture.
 * Logic mirrored from scrape cdn.odyn.dev/p/vqj6/bundle.js `xt()`.
 */
export function PipelineGlobe({ markers }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const markersKey = JSON.stringify(markers);

  useEffect(() => {
    const outer = outerRef.current;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const markersEl = markersRef.current;
    const loader = loaderRef.current;
    if (!outer || !wrap || !canvas || !markersEl) return;

    const pins = JSON.parse(markersKey) as GlobeMarker[];
    let cancelled = false;
    let raf = 0;
    let observer: IntersectionObserver | null = null;
    const cleanups: Array<() => void> = [];

    markersEl.innerHTML = "";
    pins.forEach((m, i) => {
      const z = document.createElement("div");
      z.className = "cv-globe-marker";
      z.id = `cvgmk${i}`;
      z.innerHTML = `
        <div class="cv-globe-label">${m.label}</div>
        <div class="cv-globe-pin">
          <div class="cv-globe-ring" style="animation-delay:${m.delay ?? 0}s"></div>
          <div class="cv-globe-ring cv-globe-ring-2" style="animation-delay:${(m.delay ?? 0) + 1.1}s"></div>
          <div class="cv-globe-core"></div>
        </div>`;
      markersEl.appendChild(z);
    });

    let w = wrap.clientWidth;
    let h = wrap.clientHeight;
    let visible = false;
    let dragging = false;
    let rotY = 0.4;
    let dragStartX = 0;
    let dragStartRot = 0;
    let lastX = 0;
    let lastT = 0;
    let vel = 0;
    let base = 0;
    const autoSpin = 0.0012;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / Math.max(h, 1), 0.1, 100);
    camera.position.set(0, 0.3, 2.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1));

    let earth: THREE.Mesh | null = null;
    const visibleFlags = pins.map(() => false);
    const blinkFlags = pins.map(() => false);
    const tmp = new THREE.Vector3();

    function latLngToVec(lat: number, lng: number, r = 1) {
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lng + 180) * Math.PI) / 180;
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }

    async function buildTexture() {
      const texCanvas = document.createElement("canvas");
      texCanvas.width = 4096;
      texCanvas.height = 2048;
      const ctx = texCanvas.getContext("2d")!;
      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(0, 0, 4096, 2048);

      try {
        const topo = (await fetch(DS.countries110m).then((r) => {
          if (!r.ok) throw new Error(`geo ${r.status}`);
          return r.json();
        })) as WorldAtlas;

        const projection = geoEquirectangular()
          .scale(4096 / (2 * Math.PI))
          .translate([4096 / 2, 2048 / 2]);
        const path = geoPath(projection, ctx);
        const land = topoFeature(topo, topo.objects.land);
        const borders = topoMesh(topo, topo.objects.countries, (a, b) => a !== b);

        ctx.beginPath();
        path(land);
        ctx.fillStyle = "#93c5fd";
        ctx.fill();

        ctx.beginPath();
        path(borders);
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.beginPath();
        path(land);
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } catch (err) {
        console.error("[PipelineGlobe] texture", err);
      }

      const texture = new THREE.CanvasTexture(texCanvas);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      return texture;
    }

    function scheduleBlink(i: number) {
      const wait = blinkFlags[i] ? 2000 + Math.random() * 2000 : 500 + Math.random() * 2500;
      const id = window.setTimeout(() => {
        blinkFlags[i] = !blinkFlags[i];
        scheduleBlink(i);
      }, wait);
      cleanups.push(() => clearTimeout(id));
    }

    pins.forEach((_, i) => {
      const id = window.setTimeout(() => {
        blinkFlags[i] = Math.random() > 0.5;
        scheduleBlink(i);
      }, i * 180 + Math.random() * 400);
      cleanups.push(() => clearTimeout(id));
    });

    function updateMarkers() {
      if (!earth) return;
      pins.forEach((m, i) => {
        const el = document.getElementById(`cvgmk${i}`);
        if (!el) return;
        const world = latLngToVec(m.lat, m.lng, 1).clone().applyEuler(earth!.rotation);
        const front = world.z > 0.15 && blinkFlags[i];
        if (front !== visibleFlags[i]) {
          visibleFlags[i] = front;
          el.classList.remove("is-vis", "is-hid");
          void el.offsetWidth;
          el.classList.add(front ? "is-vis" : "is-hid");
        }
        if (world.z > 0.15) {
          tmp.copy(world).project(camera);
          el.style.left = `${((tmp.x + 1) / 2) * w}px`;
          el.style.top = `${(-(tmp.y - 1) / 2) * h}px`;
        }
      });
    }

    function tick() {
      if (cancelled) return;
      if (!visible) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!dragging) {
        if (Math.abs(vel) > 1e-4) {
          rotY += vel;
          vel *= 0.95;
          base = rotY - 0.4;
        } else {
          base += autoSpin;
          rotY = 0.4 + base;
        }
      }
      if (earth) earth.rotation.y = rotY;
      updateMarkers();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }

    const onDown = (e: PointerEvent) => {
      dragging = true;
      dragStartX = e.clientX;
      dragStartRot = rotY;
      lastX = e.clientX;
      lastT = performance.now();
      vel = 0;
      canvas.style.cursor = "grabbing";
      base = rotY - 0.4;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      rotY = dragStartRot + (dx / w) * Math.PI * 2;
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) vel = ((e.clientX - lastX) / w) * Math.PI * 2 * (16 / dt);
      lastX = e.clientX;
      lastT = now;
    };
    const onUp = () => {
      dragging = false;
      canvas.style.cursor = "grab";
      base = rotY - 0.4;
    };
    const onResize = () => {
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("resize", onResize);
    cleanups.push(() => {
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
    });

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          visible = en.isIntersecting;
        });
      },
      { threshold: 0 }
    );
    observer.observe(outer);

    (async () => {
      const texture = await buildTexture();
      if (cancelled) {
        texture.dispose();
        return;
      }
      earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 128, 128),
        new THREE.MeshBasicMaterial({ map: texture })
      );
      earth.rotation.x = 0.48;
      earth.rotation.y = rotY;
      scene.add(earth);
      if (loader) loader.style.display = "none";
      // Ensure first paint even before IO fires (Playwright / below-fold)
      visible = true;
      tick();

      cleanups.push(() => {
        cancelAnimationFrame(raf);
        observer?.disconnect();
        texture.dispose();
        earth?.geometry.dispose();
        const mat = earth?.material as THREE.MeshBasicMaterial | undefined;
        mat?.map?.dispose();
        mat?.dispose();
        renderer.dispose();
      });
    })().catch((err) => {
      console.error("[PipelineGlobe]", err);
      if (loader) loader.textContent = "Globe unavailable";
    });

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      observer?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [markersKey]);

  return (
    <div ref={outerRef} className="cv-globe-frame">
      <div ref={wrapRef} className="cv-globe-wrap">
        <canvas ref={canvasRef} className="cv-globe-canvas" />
        <div ref={markersRef} className="cv-globe-markers" />
        <div className="cv-globe-fade" />
        <div ref={loaderRef} className="cv-globe-loader">
          Loading…
        </div>
      </div>
      <div className="cv-globe-gradient" />
    </div>
  );
}
