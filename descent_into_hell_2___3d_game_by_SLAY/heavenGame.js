// heavenGame.js

// Initialize the Heaven game with additional Quality of Life features

export function initializeHeavenGame() {
  let ANGEL_COUNT = 5;
  const ANGEL_RESPAWN_DELAY = 5000;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xb3e5fc, 0.015);
  scene.background = new THREE.Color(0xe0f7fa);
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('game').appendChild(renderer.domElement);

  class BaseEnemy {
    constructor() {
      this.speed = 0.05;
      this.health = 100;
      this.value = 1;
      this.damage = 0.5;
      this.lastAttackTime = 0;
      this.attackCooldown = 2000;
    }

    update(playerPosition) {
      const direction = new THREE.Vector3().subVectors(playerPosition, this.body.position).normalize();
      this.body.position.add(direction.multiplyScalar(this.speed));
      this.body.lookAt(playerPosition);
      this.body.position.y = 2 + Math.sin(Date.now() * 0.003) * 0.5;
      
      // Base attack pattern
      if (Date.now() - this.lastAttackTime > this.attackCooldown) {
        if (this.body.position.distanceTo(playerPosition) < 5) {
          this.attack(playerPosition);
          this.lastAttackTime = Date.now();
        }
      }
      
      return this.body.position.distanceTo(playerPosition) < 2;
    }

    attack(playerPosition) {
      // Override in subclasses
    }

    damage(amount) {
      this.health -= amount;
      createHellPortal(this.body.position);
      createScreenFlash();
      this.body.material.emissive.setHex(0xff0000);
      this.body.scale.set(1.5, 1.5, 1.5);
      
      setTimeout(() => {
        this.body.scale.set(1, 1, 1);
        this.body.material.emissive.setHex(0x330000);
      }, 200);

      return this.health <= 0;
    }

    cleanup() {
      // Override in subclasses if needed
    }
  }

  class DemonLord extends BaseEnemy {
    constructor() {
      super();
      this.health = 200;
      this.speed = 0.03;
      this.value = 3;
      this.damage = 1;

      const bodyGeometry = new THREE.ConeGeometry(2, 5, 8);
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x800000,
        emissive: 0x330000,
        wireframe: true
      });
      this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      
      const crownGeometry = new THREE.CylinderGeometry(1.2, 1.5, 1, 8);
      const crownMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        emissive: 0x996515,
        wireframe: true
      });
      this.crown = new THREE.Mesh(crownGeometry, crownMaterial);
      this.crown.position.y = 3;
      this.body.add(this.crown);

      const wingGeometry = new THREE.BoxGeometry(4, 2, 0.1);
      const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0x600000,
        emissive: 0x330000,
        wireframe: true
      });
      this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
      this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
      this.leftWing.position.set(-2, 1, 0);
      this.rightWing.position.set(2, 1, 0);
      this.body.add(this.leftWing);
      this.body.add(this.rightWing);

      this.body.position.set((Math.random() - 0.5) * 80, 2, (Math.random() - 0.5) * 80);
      scene.add(this.body);
      
      this.attackPatterns = ['flamePillar', 'darkOrbs', 'hellWave'];
      this.currentPattern = 0;
    }

    update(playerPosition) {
      super.update(playerPosition);
      
      this.crown.rotation.y += 0.02;
      this.body.rotation.z = Math.sin(Date.now() * 0.002) * 0.2;
      
      const wingFlap = Math.sin(Date.now() * 0.01) * 0.5;
      this.leftWing.rotation.z = wingFlap;
      this.rightWing.rotation.z = -wingFlap;
      
      if (Math.random() < 0.02) {
        const pattern = this.attackPatterns[this.currentPattern];
        this[pattern](playerPosition);
        this.currentPattern = (this.currentPattern + 1) % this.attackPatterns.length;
      }
    }

    flamePillar(playerPosition) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(0.3),
          new THREE.MeshPhongMaterial({
            color: 0xff4400,
            emissive: 0xff2200
          })
        );
        const radius = 3;
        flame.position.set(
          this.body.position.x + Math.cos(angle) * radius,
          this.body.position.y,
          this.body.position.z + Math.sin(angle) * radius
        );
        scene.add(flame);
        
        new TWEEN.Tween(flame.position)
          .to({
            x: flame.position.x + Math.cos(angle) * 10,
            y: flame.position.y + 5,
            z: flame.position.z + Math.sin(angle) * 10
          }, 1000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
        
        new TWEEN.Tween(flame.material)
          .to({ opacity: 0 }, 1000)
          .onComplete(() => scene.remove(flame))
          .start();
      }
    }

    darkOrbs(playerPosition) {
      for (let i = 0; i < 8; i++) {
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.4),
          new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x330000
          })
        );
        const angle = (i / 8) * Math.PI * 2;
        orb.position.copy(this.body.position);
        scene.add(orb);
        
        new TWEEN.Tween(orb.position)
          .to(playerPosition, 2000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onComplete(() => scene.remove(orb))
          .start();
      }
    }

    hellWave(playerPosition) {
      const wave = new THREE.Mesh(
        new THREE.RingGeometry(1, 2, 32),
        new THREE.MeshPhongMaterial({
          color: 0xff0000,
          emissive: 0x660000,
          transparent: true,
          opacity: 0.7
        })
      );
      wave.position.copy(this.body.position);
      wave.rotation.x = Math.PI / 2;
      scene.add(wave);
      
      new TWEEN.Tween(wave.scale)
        .to({ x: 10, y: 10, z: 10 }, 1500)
        .easing(TWEEN.Easing.Circular.Out)
        .start();
        
      new TWEEN.Tween(wave.material)
        .to({ opacity: 0 }, 1500)
        .onComplete(() => scene.remove(wave))
        .start();
    }
  }

  class SpectralHunter extends BaseEnemy {
    constructor() {
      super();
      this.health = 80;
      this.speed = 0.08;
      this.value = 2;
      this.damage = 0.3;

      const bodyGeometry = new THREE.TorusGeometry(1, 0.4, 8, 16);
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x4169e1,
        emissive: 0x000066,
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
      this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      
      this.trails = [];
      for (let i = 0; i < 3; i++) {
        const trail = new THREE.Mesh(
          new THREE.SphereGeometry(0.2),
          new THREE.MeshPhongMaterial({
            color: 0x4169e1,
            transparent: true,
            opacity: 0.5
          })
        );
        this.trails.push(trail);
        scene.add(trail);
      }

      this.body.position.set((Math.random() - 0.5) * 80, 2, (Math.random() - 0.5) * 80);
      scene.add(this.body);

      this.weapons = [];
      for (let i = 0; i < 4; i++) {
        const weapon = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 1, 4),
          new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x006666,
            transparent: true,
            opacity: 0.7
          })
        );
        this.weapons.push(weapon);
        this.body.add(weapon);
      }
    }

    update(playerPosition) {
      super.update(playerPosition);
      
      this.trails.forEach((trail, i) => {
        const delay = i * 0.2;
        trail.position.lerp(this.body.position, 0.1);
        trail.position.y = this.body.position.y - 0.5 - i * 0.3;
        trail.material.opacity = 0.5 - (i * 0.1);
      });

      this.body.material.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
      this.body.rotation.x += 0.02;
      this.body.rotation.y += 0.03;

      this.weapons.forEach((weapon, i) => {
        const angle = (Date.now() * 0.002) + (i * Math.PI / 2);
        weapon.position.x = Math.cos(angle) * 1.5;
        weapon.position.z = Math.sin(angle) * 1.5;
        weapon.rotation.y = angle + Math.PI / 2;
      });
    }

    attack(playerPosition) {
      this.weapons.forEach((weapon, i) => {
        const clone = weapon.clone();
        clone.position.copy(this.body.position);
        scene.add(clone);
        
        const targetPos = new THREE.Vector3().copy(playerPosition);
        targetPos.y += Math.sin(i * Math.PI / 2) * 2;
        
        new TWEEN.Tween(clone.position)
          .to(targetPos, 1000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
          
        new TWEEN.Tween(clone.rotation)
          .to({ x: Math.PI * 4, y: Math.PI * 4, z: Math.PI * 4 }, 1000)
          .start();
      });
    }

    cleanup() {
      this.trails.forEach(trail => scene.remove(trail));
    }
  }

  class WhisperingShade extends BaseEnemy {
    constructor() {
      super();
      this.health = 60;
      this.speed = 0.06;
      this.value = 2;
      this.damage = 0.2;

      const bodyGeometry = new THREE.SphereGeometry(1, 16, 16);
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x2c003e,
        emissive: 0x1a0029,
        wireframe: true,
        transparent: true,
        opacity: 0.7
      });
      this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);

      this.shrouds = [];
      for (let i = 0; i < 6; i++) {
        const shroud = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 2),
          new THREE.MeshPhongMaterial({
            color: 0x4a0066,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
          })
        );
        this.shrouds.push(shroud);
        this.body.add(shroud);
      }

      this.body.position.set((Math.random() - 0.5) * 80, 2, (Math.random() - 0.5) * 80);
      scene.add(this.body);
    }

    update(playerPosition) {
      super.update(playerPosition);

      this.shrouds.forEach((shroud, i) => {
        const time = Date.now() * 0.001;
        const angle = (i / this.shrouds.length) * Math.PI * 2;
        shroud.position.x = Math.cos(time + angle) * 1.5;
        shroud.position.z = Math.sin(time + angle) * 1.5;
        shroud.rotation.y = Math.sin(time * 2 + angle) * 0.5;
        shroud.material.opacity = 0.3 + Math.sin(time * 3 + angle) * 0.2;
      });

      this.body.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.1);
    }

    attack(playerPosition) {
      for (let i = 0; i < 8; i++) {
        const tendril = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.05, 2),
          new THREE.MeshPhongMaterial({
            color: 0x2c003e,
            transparent: true,
            opacity: 0.6
          })
        );
        tendril.position.copy(this.body.position);
        scene.add(tendril);

        const angle = (i / 8) * Math.PI * 2;
        const targetPos = new THREE.Vector3(
          this.body.position.x + Math.cos(angle) * 5,
          this.body.position.y,
          this.body.position.z + Math.sin(angle) * 5
        );

        new TWEEN.Tween(tendril.position)
          .to(targetPos, 1000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();

        new TWEEN.Tween(tendril.material)
          .to({ opacity: 0 }, 1000)
          .onComplete(() => scene.remove(tendril))
          .start();
      }
    }
  }

  class Virtue {
    constructor() {
      const geometry = new THREE.SphereGeometry(0.3, 8, 8);
      const material = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        emissive: 0xffffe0,
        wireframe: true
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set((Math.random() - 0.5) * 80, 1 + Math.random() * 3, (Math.random() - 0.5) * 80);
      scene.add(this.mesh);
      this.particles = [];
      this.lastParticleTime = 0;
    }

    update() {
      this.mesh.rotation.y += 0.02;
      this.mesh.position.y = 1 + Math.sin(Date.now() * 0.002) * 0.5;
      if (Date.now() - this.lastParticleTime > 100) {
        const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0.5
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(this.mesh.position);
        particle.userData.createdAt = Date.now();
        scene.add(particle);
        this.particles.push(particle);
        this.lastParticleTime = Date.now();
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        const age = Date.now() - particle.userData.createdAt;
        if (age > 1000) {
          scene.remove(particle);
          this.particles.splice(i, 1);
        } else {
          particle.material.opacity = 0.5 * (1 - age / 1000);
          particle.position.y += 0.02;
        }
      }
    }
  }

  class Angel {
    constructor() {
      const bodyGeometry = new THREE.SphereGeometry(1, 16, 16);
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x80deea,
        emissive: 0x00acc1,
        wireframe: true
      });
      this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      this.body.position.set((Math.random() - 0.5) * 80, 2, (Math.random() - 0.5) * 80);
      this.speed = 0.05;
      this.health = 100;
      scene.add(this.body);
    }

    update(playerPosition) {
      const direction = new THREE.Vector3().subVectors(playerPosition, this.body.position).normalize();
      this.body.position.add(direction.multiplyScalar(this.speed));
      this.body.lookAt(playerPosition);
      this.body.position.y = 2 + Math.sin(Date.now() * 0.003) * 0.5;
      return this.body.position.distanceTo(playerPosition) < 2;
    }

    heal(amount) {
      this.health += amount;
      if (this.health > 100) this.health = 100;
    }
  }

  class VoidWalker extends BaseEnemy {
    constructor() {
      super();
      this.health = 70;
      this.speed = 0.07;
      this.value = 2;
      this.damage = 0.25;

      // Create ethereal, void-like body
      const bodyGeometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x000066,
        emissive: 0x000033,
        wireframe: true,
        transparent: true,
        opacity: 0.7
      });
      this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);

      // Add tentacles
      this.tentacles = [];
      for (let i = 0; i < 8; i++) {
        const tentacle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.01, 2),
          new THREE.MeshPhongMaterial({
            color: 0x000099,
            transparent: true,
            opacity: 0.5
          })
        );
        this.tentacles.push(tentacle);
        this.body.add(tentacle);
      }

      this.body.position.set((Math.random() - 0.5) * 80, 2, (Math.random() - 0.5) * 80);
      scene.add(this.body);
    }

    update(playerPosition) {
      super.update(playerPosition);
      
      // Rotate body in weird patterns
      this.body.rotation.x += 0.02;
      this.body.rotation.y += Math.sin(Date.now() * 0.001) * 0.03;
      
      // Animate tentacles
      this.tentacles.forEach((tentacle, i) => {
        const time = Date.now() * 0.001;
        const angle = (i / this.tentacles.length) * Math.PI * 2 + time;
        tentacle.position.x = Math.cos(angle) * 1.5;
        tentacle.position.z = Math.sin(angle) * 1.5;
        tentacle.rotation.x = Math.sin(time + i) * 0.5;
        tentacle.rotation.z = Math.cos(time + i) * 0.5;
      });

      // Phase in and out of existence
      this.body.material.opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.4;
    }

    attack(playerPosition) {
      const voidSpheres = [];
      for (let i = 0; i < 4; i++) {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.3),
          new THREE.MeshPhongMaterial({
            color: 0x000066,
            emissive: 0x000033,
            transparent: true,
            opacity: 0.7
          })
        );
        sphere.position.copy(this.body.position);
        scene.add(sphere);
        voidSpheres.push(sphere);
        
        const angle = (i / 4) * Math.PI * 2;
        const targetPos = new THREE.Vector3(
          this.body.position.x + Math.cos(angle) * 5,
          this.body.position.y,
          this.body.position.z + Math.sin(angle) * 5
        );
        
        new TWEEN.Tween(sphere.position)
          .to(targetPos, 1500)
          .easing(TWEEN.Easing.Cubic.Out)
          .start();
          
        new TWEEN.Tween(sphere.material)
          .to({ opacity: 0 }, 1500)
          .onComplete(() => scene.remove(sphere))
          .start();
      }
    }
  }

  class ChaosEntity extends BaseEnemy {
    constructor() {
      super();
      this.health = 120;
      this.speed = 0.04;
      this.value = 3;
      this.damage = 0.4;

      // Create fractalized body
      const geometry = new THREE.IcosahedronGeometry(1, 1);
      const material = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        emissive: 0x660066,
        wireframe: true,
        transparent: true
      });
      this.body = new THREE.Mesh(geometry, material);

      // Add orbiting fragments
      this.fragments = [];
      for (let i = 0; i < 12; i++) {
        const fragment = new THREE.Mesh(
          new THREE.TetrahedronGeometry(0.3),
          new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0x660066,
            transparent: true,
            opacity: 0.6
          })
        );
        this.fragments.push(fragment);
        this.body.add(fragment);
      }

      this.body.position.set((Math.random() - 0.5) * 80, 2, (Math.random() - 0.5) * 80);
      scene.add(this.body);
    }

    update(playerPosition) {
      super.update(playerPosition);
      
      // Chaotic rotation and morphing
      this.body.rotation.x += Math.sin(Date.now() * 0.001) * 0.05;
      this.body.rotation.y += Math.cos(Date.now() * 0.001) * 0.05;
      this.body.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.2);

      // Animate fragments in chaos patterns
      this.fragments.forEach((fragment, i) => {
        const time = Date.now() * 0.001;
        const radius = 2 + Math.sin(time + i) * 0.5;
        const angle1 = time * (i % 2 ? 1 : -1) + i * Math.PI / 6;
        const angle2 = time * (i % 3 ? 1 : -1) + i * Math.PI / 4;
        
        fragment.position.set(
          Math.cos(angle1) * Math.sin(angle2) * radius,
          Math.sin(angle1) * radius,
          Math.cos(angle2) * radius
        );
        fragment.rotation.set(time * 2, time * 3, time * 4);
      });
    }

    attack(playerPosition) {
      for (let i = 0; i < 8; i++) {
        const chaos = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.3),
          new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0x660066,
            transparent: true,
            opacity: 0.8
          })
        );
        chaos.position.copy(this.body.position);
        scene.add(chaos);
        
        const angle = Math.random() * Math.PI * 2;
        const height = 2 + Math.random() * 3;
        const targetPos = new THREE.Vector3(
          this.body.position.x + Math.cos(angle) * 8,
          this.body.position.y + height,
          this.body.position.z + Math.sin(angle) * 8
        );
        
        new TWEEN.Tween(chaos.position)
          .to(targetPos, 2000)
          .easing(TWEEN.Easing.Quartic.InOut)
          .onUpdate(() => {
            chaos.rotation.x += 0.1;
            chaos.rotation.y += 0.1;
            chaos.rotation.z += 0.1;
          })
          .start();
        
        new TWEEN.Tween(chaos.material)
          .to({ opacity: 0 }, 2000)
          .onComplete(() => scene.remove(chaos))
          .start();
      }
    }
  }

  class RealityGlitch extends BaseEnemy {
    constructor() {
      super();
      this.health = 90;
      this.speed = 0.06;
      this.value = 2;
      this.damage = 0.3;

      // Create glitchy body
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x006666,
        wireframe: true,
        transparent: true
      });
      this.body = new THREE.Mesh(geometry, material);

      // Add glitch segments
      this.segments = [];
      for (let i = 0; i < 6; i++) {
        const segment = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.8, 0.8),
          new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
          })
        );
        this.segments.push(segment);
        this.body.add(segment);
      }

      this.body.position.set((Math.random() - 0.5) * 80, 2, (Math.random() - 0.5) * 80);
      scene.add(this.body);
    }

    update(playerPosition) {
      super.update(playerPosition);
      
      // Glitch effect - random positioning of segments
      if (Math.random() < 0.1) {
        this.segments.forEach(segment => {
          segment.position.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          );
          segment.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );
        });
      }

      // Random color shifts
      if (Math.random() < 0.05) {
        this.body.material.color.setHSL(Math.random(), 1, 0.5);
        this.segments.forEach(segment => {
          segment.material.color.setHSL(Math.random(), 1, 0.5);
        });
      }
    }

    attack(playerPosition) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const glitch = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshPhongMaterial({
              color: 0x00ffff,
              transparent: true,
              opacity: 0.7
            })
          );
          glitch.position.copy(this.body.position);
          scene.add(glitch);

          const targetPos = new THREE.Vector3()
            .copy(playerPosition)
            .add(new THREE.Vector3(
              (Math.random() - 0.5) * 4,
              Math.random() * 2,
              (Math.random() - 0.5) * 4
            ));

          new TWEEN.Tween(glitch.position)
            .to(targetPos, 1000)
            .easing(TWEEN.Easing.Back.InOut)
            .onUpdate(() => {
              glitch.rotation.x += 0.2;
              glitch.rotation.y += 0.2;
              glitch.scale.setScalar(Math.random() * 2);
            })
            .start();

          new TWEEN.Tween(glitch.material)
            .to({ opacity: 0 }, 1000)
            .onComplete(() => scene.remove(glitch))
            .start();
        }, i * 200);
      }
    }
  }

  class ProceduralMapGenerator {
    constructor(scene) {
      this.scene = scene;
      this.chunks = new Map(); // Store loaded chunks
      this.chunkSize = 100;
      this.renderDistance = 3;
      this.heightMap = new SimplexNoise();
      this.detailNoise = new SimplexNoise();
      this.biomeNoise = new SimplexNoise();
    }

    generateChunk(chunkX, chunkZ) {
      const chunkKey = `${chunkX},${chunkZ}`;
      if (this.chunks.has(chunkKey)) return;

      const chunk = new THREE.Group();
      
      // Generate terrain mesh
      const geometry = new THREE.PlaneGeometry(
        this.chunkSize, 
        this.chunkSize,
        50, 
        50
      );

      // Apply height modifications
      const vertices = geometry.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i] + chunkX * this.chunkSize;
        const z = vertices[i + 2] + chunkZ * this.chunkSize;
        
        // Combine different noise frequencies
        const height = this.heightMap.noise2D(x * 0.01, z * 0.01) * 10 +
                      this.detailNoise.noise2D(x * 0.05, z * 0.05) * 2;
                      
        const biomeValue = this.biomeNoise.noise2D(x * 0.005, z * 0.005);
        
        vertices[i + 1] = height;
      }

      geometry.computeVertexNormals();
      
      // Create terrain material based on biome
      const material = new THREE.MeshPhongMaterial({
        color: 0x80deea,
        wireframe: true,
        emissive: 0x00acc1,
        shininess: 30
      });

      const terrain = new THREE.Mesh(geometry, material);
      terrain.rotation.x = -Math.PI / 2;
      chunk.add(terrain);

      // Add decorative elements
      this.addDecorations(chunk, chunkX, chunkZ, biomeValue);

      chunk.position.set(
        chunkX * this.chunkSize,
        0,
        chunkZ * this.chunkSize
      );

      this.scene.add(chunk);
      this.chunks.set(chunkKey, chunk);
    }

    addDecorations(chunk, chunkX, chunkZ, biomeValue) {
      // Crystal formations
      for (let i = 0; i < 20; i++) {
        const crystal = this.createCrystalFormation();
        crystal.position.set(
          (Math.random() - 0.5) * this.chunkSize,
          Math.random() * 5,
          (Math.random() - 0.5) * this.chunkSize
        );
        chunk.add(crystal);
      }

      // Floating islands
      for (let i = 0; i < 5; i++) {
        const island = this.createFloatingIsland();
        island.position.set(
          (Math.random() - 0.5) * this.chunkSize,
          20 + Math.random() * 30,
          (Math.random() - 0.5) * this.chunkSize
        );
        chunk.add(island);
      }

      // Light pillars
      for (let i = 0; i < 3; i++) {
        const pillar = this.createLightPillar();
        pillar.position.set(
          (Math.random() - 0.5) * this.chunkSize,
          0,
          (Math.random() - 0.5) * this.chunkSize
        );
        chunk.add(pillar);
      }
    }

    createCrystalFormation() {
      const crystal = new THREE.Group();
      
      const colors = [0x4fc3f7, 0x29b6f6, 0x03a9f4];
      
      for (let i = 0; i < 5; i++) {
        const geometry = new THREE.ConeGeometry(
          0.5 - i * 0.1,
          2 + i,
          4
        );
        
        const material = new THREE.MeshPhongMaterial({
          color: colors[i % colors.length],
          wireframe: true,
          emissive: 0x0288d1,
          shininess: 100
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.z = Math.random() * Math.PI;
        mesh.position.y = i * 1.5;
        
        crystal.add(mesh);
      }

      return crystal;
    }

    createFloatingIsland() {
      const island = new THREE.Group();

      // Base rock
      const baseGeometry = new THREE.IcosahedronGeometry(5, 1);
      const baseMaterial = new THREE.MeshPhongMaterial({
        color: 0xb3e5fc,
        wireframe: true,
        emissive: 0x0288d1
      });
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.scale.y = 0.5;
      island.add(base);

      // Add crystal decorations
      for (let i = 0; i < 3; i++) {
        const crystal = this.createCrystalFormation();
        crystal.position.y = 3;
        crystal.rotation.y = (i / 3) * Math.PI * 2;
        crystal.position.x = Math.cos(crystal.rotation.y) * 3;
        crystal.position.z = Math.sin(crystal.rotation.y) * 3;
        island.add(crystal);
      }

      return island;
    }

    createLightPillar() {
      const pillar = new THREE.Group();

      // Base
      const baseGeometry = new THREE.CylinderGeometry(1, 2, 20, 8);
      const baseMaterial = new THREE.MeshPhongMaterial({
        color: 0x4fc3f7,
        wireframe: true,
        emissive: 0x0288d1,
        transparent: true,
        opacity: 0.7
      });

      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      pillar.add(base);

      // Light beam
      const beamGeometry = new THREE.CylinderGeometry(0.5, 0.5, 100, 8);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0x4fc3f7,
        transparent: true,
        opacity: 0.3
      });

      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.y = 50;
      pillar.add(beam);

      // Add light source
      const light = new THREE.PointLight(0x4fc3f7, 1, 50);
      light.position.y = 10;
      pillar.add(light);

      return pillar;
    }

    update(playerPosition) {
      // Calculate current chunk
      const chunkX = Math.floor(playerPosition.x / this.chunkSize);
      const chunkZ = Math.floor(playerPosition.z / this.chunkSize);

      // Generate chunks in render distance
      for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
        for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
          this.generateChunk(chunkX + x, chunkZ + z);
        }
      }

      // Remove chunks outside render distance
      for (const [key, chunk] of this.chunks) {
        const [cx, cz] = key.split(',').map(Number);
        if (Math.abs(cx - chunkX) > this.renderDistance || 
            Math.abs(cz - chunkZ) > this.renderDistance) {
          this.scene.remove(chunk);
          this.chunks.delete(key);
        }
      }
    }
  }

  // Initialize map generator
  const mapGenerator = new ProceduralMapGenerator(scene);

  let health = 100;
  const moveSpeed = 0.15;
  const sprintMultiplier = 1.8;
  const jumpForce = 0.2;
  const gravity = 0.01;
  let velocity = 0;
  const keys = {};
  let isJumping = false;
  let gameTime = 0;
  let angels = 0;
  let virtues = 0;
  const virtuesList = [];
  const angelsList = [];
  const demonsList = [];
  for (let i = 0; i < ANGEL_COUNT; i++) {
    angelsList.push(new Angel());
  }
  for (let i = 0; i < 10; i++) {
    virtuesList.push(new Virtue());
  }
  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener('mousemove', e => {
    const sensitivity = 0.002;
    mouseX = e.movementX * sensitivity;
    mouseY = e.movementY * sensitivity;
    camera.rotation.y -= mouseX;
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x - mouseY));
  });

  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
  });

  window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' && !isJumping) {
      velocity = jumpForce;
      isJumping = true;
    }
    if (e.key.toLowerCase() === 'e') {
      collectVirtues();
    }
    if (e.key.toLowerCase() === 'c') { // Toggle Chat
      toggleChat();
    }
  });

  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.geometry = new THREE.BufferGeometry();
      this.positions = new Float32Array(1000 * 3);
      this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
      
      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      
      this.points = new THREE.Points(this.geometry, material);
      scene.add(this.points);
    }

    addParticle(position) {
      if (this.particles.length < 1000) {
        this.particles.push({
          position: position.clone(),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.1,
            (Math.random() - 0.5) * 0.1
          ),
          life: 1.0
        });
      }
    }

    update() {
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        particle.position.add(particle.velocity);
        particle.life -= 0.01;
        
        this.positions[i * 3] = particle.position.x;
        this.positions[i * 3 + 1] = particle.position.y;
        this.positions[i * 3 + 2] = particle.position.z;
      }
      
      this.particles = this.particles.filter(p => p.life > 0);
      this.geometry.attributes.position.needsUpdate = true;
    }
  }

  const particleSystem = new ParticleSystem();

  const progressBar = document.createElement('div');
  progressBar.className = 'heaven-progress';
  progressBar.innerHTML = `
    <div class="progress-fill"></div>
    <div class="progress-text">Path to Enlightenment: 0%</div>
  `;
  document.body.appendChild(progressBar);

  function updateProgress(value) {
    const fill = progressBar.querySelector('.progress-fill');
    const text = progressBar.querySelector('.progress-text');
    fill.style.width = `${value}%`;
    text.textContent = `Path to Enlightenment: ${Math.floor(value)}%`;
  }

  function collectVirtues() {
    virtuesList.forEach((virtue, index) => {
      if (virtue.mesh.position.distanceTo(camera.position) < 3) {
        for (let i = 0; i < 20; i++) {
          particleSystem.addParticle(virtue.mesh.position);
        }
        
        scene.remove(virtue.mesh);
        virtuesList.splice(index, 1);
        virtues++;
        health = Math.min(100, health + 5);
        
        updateProgress(virtues * 10);
        
        const effect = document.createElement('div');
        effect.className = 'virtue-collected';
        effect.textContent = '+1 VIRTUE';
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
        
        virtuesList.push(new Virtue());
        
        if (virtues >= 8) {
          window.menuSystem?.showHint('Almost ready to ascend! Collect more virtues!');
        }
      }
    });
  }

  function toggleChat() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer.style.display === 'flex') {
      chatContainer.style.display = 'none';
    } else {
      chatContainer.style.display = 'flex';
    }
  }

  function spawnEnemy() {
    const rand = Math.random();
    let enemy;
    
    if (rand < 0.1) {
      enemy = new DemonLord();
    } else if (rand < 0.25) {
      enemy = new SpectralHunter(); 
    } else if (rand < 0.4) {
      enemy = new WhisperingShade();
    } else if (rand < 0.55) {
      enemy = new VoidWalker();
    } else if (rand < 0.7) {
      enemy = new ChaosEntity();
    } else if (rand < 0.85) {
      enemy = new RealityGlitch();
    } else {
      enemy = new Angel();
    }
    
    demonsList.push(enemy);
  }

  function removeEnemy(index) {
    const enemy = demonsList[index];
    if (enemy.cleanup) {
      enemy.cleanup();
    }
    scene.remove(enemy.body);
    demonsList.splice(index, 1);
  }

  function animate() {
    requestAnimationFrame(animate);
    
    if (window.gameState?.paused) {
      renderer.render(scene, camera);
      return;
    }

    // Update procedural map generation
    mapGenerator.update(camera.position);

    particleSystem.update();
    gameTime += 1 / 60;
    document.getElementById('health').textContent = `DIVINE ENERGY: ${Math.floor(health)}%`;
    const currentSpeed = keys['shift'] ? moveSpeed * sprintMultiplier : moveSpeed;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    camera.getWorldDirection(forward);
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
    if (keys['w']) camera.position.addScaledVector(forward, currentSpeed);
    if (keys['s']) camera.position.addScaledVector(forward, -currentSpeed);
    if (keys['a']) camera.position.addScaledVector(right, -currentSpeed);
    if (keys['d']) camera.position.addScaledVector(right, currentSpeed);
    camera.position.y += velocity;
    velocity -= gravity;
    if (camera.position.y <= 2) {
      camera.position.y = 2;
      velocity = 0;
      isJumping = false;
    }

    demonsList.forEach(enemy => {
      if (enemy.update(camera.position)) {
        health -= enemy.damage;
      }
    });

    virtuesList.forEach(virtue => virtue.update());
    renderer.render(scene, camera);
  }

  animate();

  document.addEventListener('keydown', e => {
    if (e.key === 'h' || e.key === 'H') {
      window.menuSystem?.showHint('Collect 10 virtues to complete your ascension!');
    }
  });

  // Chat Initialization
  // This assumes that chat.js has already set up the necessary WebSocket connection

  window.gameState = {
    paused: false
  };
}