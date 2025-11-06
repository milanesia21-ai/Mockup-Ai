import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GARMENT_3D_MODELS } from '../constants';

interface Mockup3DViewerProps {
  imageUrl: string;
  selectedGarment: string;
}

const LoadingOverlay: React.FC = () => (
    <div className="absolute inset-0 bg-gray-700/80 flex items-center justify-center text-white backdrop-blur-sm z-10">
        <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Caricamento Modello 3D...
    </div>
);

export const Mockup3DViewer: React.FC<Mockup3DViewerProps> = ({ imageUrl, selectedGarment }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const animationFrameIdRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current || !imageUrl) return;

    setIsLoading(true);
    const mountNode = mountRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x52525b); // Tailwind gray-600

    const camera = new THREE.PerspectiveCamera(50, mountNode.clientWidth / mountNode.clientHeight, 0.1, 1000);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountNode.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 1;
    controls.maxDistance = 10;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const modelPath = GARMENT_3D_MODELS[selectedGarment];

    // More robustly check for a valid path before attempting to load a GLB model.
    if (modelPath) {
        // Load real 3D model
        const gltfLoader = new GLTFLoader();
        const textureLoader = new THREE.TextureLoader();

        Promise.all([
            new Promise<THREE.Texture>((resolve, reject) => textureLoader.load(imageUrl, resolve, undefined, reject)),
            new Promise<any>((resolve, reject) => gltfLoader.load(modelPath, resolve, undefined, reject))
        ]).then(([texture, gltf]) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.flipY = false;

            const model = gltf.scene;

            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    const newMaterial = (mesh.material as THREE.MeshStandardMaterial).clone();
                    newMaterial.map = texture;
                    newMaterial.needsUpdate = true;
                    mesh.material = newMaterial;
                }
            });

            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            model.position.x += (model.position.x - center.x);
            model.position.y += (model.position.y - center.y);
            model.position.z += (model.position.z - center.z);
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxDim;
            model.scale.set(scale, scale, scale);

            scene.add(model);
            setIsLoading(false);

        }).catch(error => {
            console.error("Failed to load 3D model or texture:", error);
            setIsLoading(false);
        });
    } else {
        // Fallback to plane if no 3D model is available
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(imageUrl, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            const aspectRatio = texture.image.width / texture.image.height;
            const geometry = new THREE.PlaneGeometry(aspectRatio, 1, 32, 32);
            const material = new THREE.MeshStandardMaterial({
              map: texture,
              side: THREE.DoubleSide,
              roughness: 0.7,
              metalness: 0.1,
            });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            setIsLoading(false);
        }, undefined, (error) => {
            console.error('An error happened loading the texture for plane fallback.', error);
            setIsLoading(false);
        });
    }

    // Resize handler
    const handleResize = () => {
      // Defer resize logic to the next microtask to avoid ResizeObserver loop errors.
      queueMicrotask(() => {
        if (!mountRef.current) return;
        const { clientWidth, clientHeight } = mountRef.current;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
      });
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountNode);

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode === mountNode) {
          mountNode.removeChild(renderer.domElement);
      }
      scene.traverse(object => {
          if (object instanceof THREE.Mesh) {
              if (object.geometry) object.geometry.dispose();
              if (object.material) {
                  if (Array.isArray(object.material)) {
                      object.material.forEach(mat => {
                        if('dispose' in mat) mat.dispose()
                      });
                  } else {
                      if('dispose' in (object.material as THREE.Material)) (object.material as THREE.Material).dispose();
                  }
              }
          }
      });
      controls.dispose();
      renderer.dispose();
    };
  }, [imageUrl, selectedGarment]);

  return (
    <div className="w-full h-full relative" ref={mountRef}>
        {isLoading && <LoadingOverlay />}
    </div>
  );
};