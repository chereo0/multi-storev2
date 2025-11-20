import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCart } from '../../context/CartContext';

// --- 3D Scene Helpers ---
function FloatingInstancedShapes({ count = 200, mouse = { x: 0, y: 0 } }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => new Float32Array(count * 3), [count]);
  const colorA = useMemo(() => new THREE.Color('#00E5FF'), []);
  const colorB = useMemo(() => new THREE.Color('#FF00FF'), []);

  useEffect(() => {
    if (!meshRef.current) return;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const t = i / count;
      c.copy(colorA).lerp(colorB, t);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    meshRef.current.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colors, 3));
  }, [count, colors, colorA, colorB]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const radius = 8 + (i % 10) * 0.2;
      const speed = 0.2 + (i % 7) * 0.03;
      const angle = t * speed + i;
      const x = Math.cos(angle) * radius + mouse.x * 0.5;
      const y = Math.sin(angle * 0.9) * (radius * 0.15) + mouse.y * 0.5;
      const z = -6 - (i % 20) * 0.2 + Math.sin(angle * 0.3) * 0.5;

      dummy.position.set(x, y, z);
      const s = 0.2 + (i % 5) * 0.05 + (Math.sin(t * 2 + i) + 1) * 0.03;
      dummy.scale.setScalar(s);
      dummy.rotation.set(angle * 0.2, angle * 0.3, angle * 0.1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial vertexColors roughness={0.2} metalness={0.8} transparent opacity={0.8} />
    </instancedMesh>
  );
}

function NeonScene() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const onPointerMove = useCallback((e) => {
    const x = (e.point.x / 10);
    const y = (e.point.y / 10);
    setMouse({ x, y });
  }, []);

  return (
    <group onPointerMove={onPointerMove}>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 6, 4]} intensity={1.5} color={'#00E5FF'} />
      <pointLight position={[-6, -4, 3]} intensity={1.1} color={'#FF00FF'} />
      <FloatingInstancedShapes count={280} mouse={mouse} />
    </group>
  );
}

// --- Background Helper: choose nebula from /public ---
const nebulaCandidates = [
  '/Gemini_Generated_Image_bbj2vmbbj2vmbbj2.png',
  '/Gemini_Generated_Image_pc6crxpc6crxpc6c.png',
  '/Gemini_Generated_Image_enzgvmenzgvmenzg.png',
  '/Gemini_Generated_Image_hy9bf7hy9bf7hy9b.png'
];

function useNebulaBackground() {
  const [bg, setBg] = useState(nebulaCandidates[0]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const url of nebulaCandidates) {
        try {
          await new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res();
            img.onerror = () => rej();
            img.src = url;
          });
          if (!cancelled) {
            setBg(url);
            break;
          }
        } catch (_) {
          // try next
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return bg;
}

// --- Mock Data ---
const MOCK_PRODUCTS = [
  { id: 'px-keys', name: 'KEYTRONICS', price: 590, image: '/logo192.png', rating: 4.7, reviewCount: 312, inStock: true, description: 'Holographic mechanical keyboard with adaptive neon feedback.' },
  { id: 'px-electro', name: 'ELECTRONICS', price: 280, image: '/logo192.png', rating: 4.5, reviewCount: 201, inStock: true, description: 'Quantum-ready peripherals for serious creators.' },
  { id: 'px-apparel-1', name: 'APPAREL', price: 380, image: '/logo192.png', rating: 4.2, reviewCount: 98, inStock: true, description: 'Neon-thread apparel with reactive glow.' },
  { id: 'px-apparel-2', name: 'APPAREL', price: 390, image: '/logo192.png', rating: 4.1, reviewCount: 77, inStock: false, description: 'Phase-shift streetwear built for motion.' }
];

export default function PhoenixEmporium() {
  const nebula = useNebulaBackground();
  const { addToCart, getQuantityForProduct } = useCart();

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: `url('${nebula}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <div className="backdrop-blur-md bg-black/40 border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/home" className="font-bold text-lg">Phoenix Emporium</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#featured" className="hover:text-cyan-300">Featured</a>
            <a href="#products" className="hover:text-fuchsia-300">Products</a>
            <a href="#about" className="hover:text-cyan-300">About</a>
          </nav>
          <Link to="/cart" className="px-4 py-2 rounded-lg border border-cyan-400/40 hover:bg-cyan-400/10">Cart</Link>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 -z-10">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }} gl={{ antialias: true }}>
          <NeonScene />
        </Canvas>
      </div>

      {/* Hero */}
      <section className="relative pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-8 md:p-12" style={{
            background: 'rgba(10,14,39,0.55)',
            border: '1px solid rgba(0,229,255,0.3)',
            boxShadow: '0 0 40px rgba(0,229,255,0.15), inset 0 0 30px rgba(255,0,255,0.08)'
          }}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-4">UNLEASH THE HEAT:<br />
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg,#00E5FF,#FF00FF)' }}>New Tech & Gear</span>
                </h1>
                <p className="text-[#B0B8C1] mb-6">Explore neon-grade peripherals and apparel forged for the multiverse.</p>
                <a href="#products" className="inline-block px-6 py-3 rounded-full font-semibold"
                   style={{ background: 'linear-gradient(90deg,#00E5FF,#FF00FF)', boxShadow: '0 0 24px rgba(0,229,255,0.35)' }}>EXPLORE</a>
              </div>
              <div className="w-full md:w-1/2" aria-hidden="true">
                <div className="rounded-2xl h-56 md:h-72" style={{
                  background: 'radial-gradient(closest-side, rgba(0,229,255,0.35), transparent), radial-gradient(closest-side, rgba(255,0,255,0.3), transparent)'
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ textShadow: '0 0 20px rgba(0,229,255,0.4)' }}>FEATURED PRODUCTS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_PRODUCTS.map((p) => {
              const qty = getQuantityForProduct(p.id, 'phoenix');
              return (
                <div key={p.id} className="rounded-2xl overflow-hidden backdrop-blur-sm" style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.18)'
                }}>
                  <div className="h-40 bg-black/30 flex items-center justify-center">
                    <img src={p.image} alt={p.name} className="w-24 h-24 object-contain" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{p.name}</h3>
                      <span className="text-cyan-300 font-bold">${p.price}</span>
                    </div>
                    <p className="text-xs text-[#B0B8C1] mb-3" aria-live="polite">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => addToCart(p, 'phoenix')}
                        disabled={!p.inStock}
                        className={`px-3 py-2 rounded-lg text-sm ${p.inStock ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-gray-600 cursor-not-allowed'}`}
                        aria-label={p.inStock ? `Add ${p.name} to cart` : `${p.name} out of stock`}
                      >
                        {p.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                      {qty > 0 && (
                        <span className="text-xs text-white/80">In cart: {qty}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}