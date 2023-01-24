import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import vertexShader from "./shader/vertex.glsl";
import fragmentShader from "./shader/fragment.glsl";
import vertexShader1 from "./shader/vertex1.glsl";
import fragmentShader1 from "./shader/fragment1.glsl";
import vertexShaderParticles from "./shader/vertexParticles.glsl";
import fragmentShaderParticles from "./shader/fragmentParticles.glsl";
import * as dat from "lil-gui";
import { TextureLoader } from "three";
import { test } from "./test";
import { randFloat } from "three/src/math/MathUtils";
gsap.registerPlugin(ScrollTrigger);

export class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.container = options.dom;
    this.gallery = options.gallery;

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.Xaspect = this.width / this.height;
    this.Yaspect = this.height / this.width;
    this.imageXAspect =
      this.gallery[0].source.data.width / this.gallery[0].source.data.height;
    this.imageYAspect =
      this.gallery[0].source.data.height / this.gallery[0].source.data.width;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.time = 0;
    this.isPlaying = true;
    this.count = 40;

    this.raycaster = new THREE.Raycaster();

    this.mouse = {
      x: 0,
      y: 0,
    };

    // this.settings();
    this.addObjects();
    this.addSquares();
    this.addPoints();
    this.addLines();

    this.mosueMove();
    this.touchMove();

    this.addCamera();
    this.resize();
    this.setupResize();
    this.render();
  }

  mosueMove() {
    let that = this;
    this.testPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshBasicMaterial()
    );
    window.addEventListener(
      "mousemove",
      function (event) {
        that.mouse.x = (event.clientX / this.window.innerWidth) * 2 - 1;
        that.mouse.y = -(event.clientY / this.window.innerHeight) * 2 + 1;

        that.raycaster.setFromCamera(that.mouse, that.camera);

        let intersects = that.raycaster.intersectObjects([that.testPlane]);

        if (intersects.length > 0) {
          that.materialSquares.uniforms.mouse.value = intersects[0].point;
          // console.log(that.materialSquares.uniforms.mouse.value);
        }
      },
      false
    );
  }

  touchMove() {
    let that = this;
    if ("ontouchstart" in window) {
      function touchHandler(event) {
        // document.querySelector(
        //   ".log"
        // ).innerHTML = `${event.touches[0].clientX},${event.touches[0].clientY}`;

        if (event.changedTouches[0]) {
          that.mouse.x =
            (event.changedTouches[0].clientX / this.window.innerWidth) * 2 - 1;
          that.mouse.y =
            -(event.changedTouches[0].clientY / this.window.innerHeight) * 2 +
            1;
        } else if (event.touches[0]) {
          that.mouse.x =
            (event.touches[0].clientX / this.window.innerWidth) * 2 - 1;
          that.mouse.y =
            -(event.touches[0].clientY / this.window.innerHeight) * 2 + 1;
        }

        that.raycaster.setFromCamera(that.mouse, that.camera);

        let intersects = that.raycaster.intersectObjects([that.testPlane]);

        if (intersects.length > 0) {
          that.materialSquares.uniforms.mouse.value = intersects[0].point;
        }
      }
      function touchEnd(event) {
        function lerp(start, end, t) {
          return (1 - t) * start + t * end;
        }
        function raf() {
          that.mouse.x = lerp(that.mouse.x, 0, 0.001);
          that.mouse.y = lerp(that.mouse.y, 0, 0.001);
          window.requestAnimationFrame(raf);
        }
        raf();
      }

      window.addEventListener("touchstart", touchHandler, false);
      window.addEventListener("touchmove", touchHandler, false);
      window.addEventListener("touchend", touchEnd, false);
    }
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.Xaspect = this.width / this.height;
    this.Yaspect = this.height / this.width;
    this.imageXAspect =
      this.gallery[0].source.data.width / this.gallery[0].source.data.height;
    this.imageYAspect =
      this.gallery[0].source.data.height / this.gallery[0].source.data.width;

    this.material.uniforms.uXAspect.value = this.Xaspect / this.imageXAspect;
    this.material.uniforms.uYAspect.value = this.Yaspect / this.imageYAspect;

    this.camera.aspect = this.width / this.height;

    const dist = this.camera.position.z; //perspectiveで画面いっぱいにオブジェクトを映す場合
    const height = 1 * 0.8; //0.8カメラを少し近づける
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist)); //perspectiveで画面いっぱいにオブジェクトを映す場合

    if (this.Xaspect > 1) {
      //perspectiveで画面いっぱいにオブジェクトを映す場合
      this.plane.scale.x = this.Xaspect;
    } else {
      this.plane.scale.y = this.Yaspect;
    }
    this.renderer.setSize(this.width, this.height);
    this.camera.updateProjectionMatrix();
  }

  addCamera() {
    const fov = 70;
    const fovRad = (fov / 2) * (Math.PI / 180);
    this.camera = new THREE.PerspectiveCamera(
      fov,
      this.width / this.height,
      0.001,
      1000
    );
    // let frustumSize = 1;
    // this.camera = new THREE.OrthographicCamera(
    //   frustumSize / -2,
    //   frustumSize / 2,
    //   frustumSize / 2,
    //   frustumSize / -2,
    //   -1000,
    //   1000
    // );
    this.camera.position.set(0, 0, 2);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  addObjects() {
    const video = document.querySelector("#video");
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    video.play();

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives:",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: {
          value: 0,
        },
        uXAspect: {
          value: this.Xaspect / this.imageXAspect,
        },
        uYAspect: {
          value: this.Yaspect / this.imageYAspect,
        },
        progress: {
          value: 0,
        },
        uTexture: {
          value: this.gallery[0],
        },
        uVideo: {
          value: texture,
        },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    this.plane = new THREE.Mesh(this.geometry, this.material);

    this.scene.add(this.plane);

    this.test = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    this.test.position.z = -0.1;
    this.scene.add(this.test);
  }

  addSquares() {
    this.materialSquares = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives:",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: {
          value: 0,
        },
        mouse: {
          value: new THREE.Vector3(),
        },
        uXAspect: {
          value: this.Xaspect / this.imageXAspect,
        },
        uYAspect: {
          value: this.Yaspect / this.imageYAspect,
        },
        progress: {
          value: 0,
        },
        uTexture: {
          value: this.gallery[0],
        },
      },
      vertexShader: vertexShader1,
      fragmentShader: fragmentShader1,
      transparent: true,
    });

    this.geometrySquares = new THREE.PlaneGeometry(0.1, 0.1);

    // this.squares = new THREE.Mesh(this.geometrySquares, this.materialSquares);
    this.squares = new THREE.InstancedMesh(
      this.geometrySquares,
      this.materialSquares,
      this.count ** 2
    );

    let dummy = new THREE.Object3D();
    let counter = 0;
    for (let i = -this.count / 2; i < this.count / 2; i++) {
      for (let j = -this.count / 2; j < this.count / 2; j++) {
        dummy.position.set(i / 10 + 0.05, j / 10 + 0.05, 0);
        dummy.updateMatrix();
        this.squares.setMatrixAt(counter++, dummy.matrix);
      }
    }

    this.scene.add(this.squares);
    this.squares.position.z = 0.5;
  }

  addPoints() {
    this.materialParticles = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives:",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: {
          value: 0,
        },
        mouse: {
          value: new THREE.Vector3(),
        },
        uXAspect: {
          value: this.Xaspect / this.imageXAspect,
        },
        uYAspect: {
          value: this.Yaspect / this.imageYAspect,
        },
      },
      vertexShader: vertexShaderParticles,
      fragmentShader: fragmentShaderParticles,
      transparent: true,
    });
    this.geometryParticles = new THREE.BufferGeometry();
    let vertices = [];

    for (let i = -this.count / 2; i < this.count / 2; i++) {
      for (let j = -this.count / 2; j < this.count / 2; j++) {
        vertices.push(i / 10, j / 10, 0);
      }
    }

    this.geometryParticles.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    this.particles = new THREE.Points(
      this.geometryParticles,
      this.materialParticles
    );
    this.particles.position.z = 0.5;
    this.scene.add(this.particles);
  }

  addLines() {
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
    });
    const geometry = new THREE.BufferGeometry();
    const points = [];
    for (let i = -this.count / 2; i < this.count / 2; i++) {
      points.push(new THREE.Vector3(-5, i / 10, 0));
      points.push(new THREE.Vector3(5, i / 10, 0));
    }
    for (let i = -this.count / 2; i < this.count / 2; i++) {
      points.push(new THREE.Vector3(i / 10, -5, 0));
      points.push(new THREE.Vector3(i / 10, 5, 0));
    }
    geometry.setFromPoints(points);

    this.lines = new THREE.LineSegments(geometry, material);

    this.lines.position.z = 0.5;
    this.scene.add(this.lines);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) {
      return;
    }
    const elapsedTime = this.clock.getElapsedTime();
    this.time = elapsedTime;

    this.scene.rotation.y = this.mouse.x / 15;
    this.scene.rotation.x = -this.mouse.y / 15;

    this.material.uniforms.time.value = this.time;
    this.materialSquares.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}
