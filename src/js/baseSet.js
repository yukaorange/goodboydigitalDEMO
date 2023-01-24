import { gsap } from "gsap";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import vertexShader from "./shader/vertex.glsl";
import fragmentShader from "./shader/fragment.glsl";
import * as dat from "lil-gui";

export class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    let frustumSize = 1;
    let aspect = window.innerWidth / window.innerHeight;
    const fov = 70;
    //     const fovRad = (fov / 2) * (Math.PI / 180);
    //     const dist = sizes.height / 2 / Math.tan(fovRad);//画面いっぱいにオブジェクトを映す場合
    // this.camera = new THREE.PerspectiveCamera(
    //   fov,
    //   window.innerWidth / window.innerHeight,
    //   0.001,
    //   1000
    // );
    this.camera = new THREE.OrthographicCamera(
      frustumSize / -2,
      frustumSize / 2,
      frustumSize / 2,
      frustumSize / -2,
      -1000,
      1000
    );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;
    this.isPlaying = true;

    // this.settings();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
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
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    //imageConvert
    this.imageAspect = 853 / 1280;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = (this.height / this.width) * this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives:",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: {
          value: 0,
        },
        resolution: {
          value: new THREE.Vector4(),
        },
        uvRate1: {
          value: new THREE.Vector2(1, 1),
        },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
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
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}


/**
* @param {elements:imageArray(data-set=""),log:dom,progress:dom}
* @//return,type {}
*/
export class progressLoading {
  constructor(elements, log, progress) {
    this.lengthArray = [];
    this.loadedArray = [];
    this.sumLength = 0;
    this.sumLoaded = 0;
    this.log = log;
    this.progress = progress;
    this.init(elements);
  }

  async init(elements) {
    //初めに全ての画像のContent-Lengthの値を取得する
    this.lengthArray = await Promise.all(
      [...elements].map(async (elm) => {
        return this.getLength(elm.dataset.src);
      })
    );

    this.loadedArray = [...Array(this.lengthArray.length)].map(() => 0);
    this.sumLength = this.sum(this.lengthArray);
    this.sumLoaded = this.sum(this.loadedArray);
    this.addLog(`合計 ${this.sum(this.lengthArray)} bytes のデータ`);

    //画像をロードする
    // elements.forEach((elm, index) => {
    //   this.loadXHR(elm, index);
    // });
    for (let i = 0; i < elements.length; i++) {
      setTimeout(() => {
        this.loadXHR(elements[i], i);
      }, `${i * 100}`);
      console.log(`画像読み込み${i + 1}枚目完了`);
    }
  }

  sum(array) {
    return array.reduce(function (a, b) {
      return a + b;
    }, 0);
  }

  updateProgress(e, index) {
    this.loadedArray[index] = e.loaded;
    this.sumLoaded = this.sum(this.loadedArray);
    const percent = (this.sumLoaded / this.sumLength) * 100;
    // this.progress.setAttribute("style", `width:${percent}%`);
    this.progress.textContent = `now loading...${Math.floor(percent)}%`;
    this.addLog(`${e.type}: ${this.sumLoaded} bytes 受信済み`);
    if (percent === 100) {
      document.body.classList.add("loaded");
      console.log("ロード完了→アニメーション発火");
    }
  }

  addLog(text) {
    this.log.textContent = `${this.log.textContent}${text}\n`;
  }

  addListeners(xhr, elm, index) {
    xhr.addEventListener("loadstart", (e) => {
      this.updateProgress(e, index);
    });
    xhr.addEventListener("load", (e) => {
      this.updateProgress(e, index);
    });
    xhr.addEventListener("progress", (e) => {
      this.updateProgress(e, index);
    });
    xhr.addEventListener("error", (e) => {
      this.updateProgress(e, index);
    });
    xhr.addEventListener("abort", (e) => {
      this.updateProgress(e, index);
    });
    xhr.addEventListener("loadend", (e) => {
      this.updateProgress(e, index);
      if (xhr.readyState === xhr.DONE && xhr.status === 200) {
        //blobで読み込む場合
        //elm.src = URL.createObjectURL(xhr.response);

        //キャッシュがあるのでsrcにパスを書くだけでも問題なさそう（体感的な表示速度の違いが感じられない）
        elm.src = elm.dataset.src;

        this.addLog(`${index + 1} 枚目の画像の読み込みが完了`);

        if (this.sumLength === this.sumLoaded) {
          this.addLog("全ての画像のロード完了（描画が完了したわけではない）");
        }
      }
    });
  }

  getLength(url) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener("readystatechange", () => {
        if (xhr.readyState === xhr.HEADERS_RECEIVED) {
          //レスポンスヘッダからContent-Lengthの値を読み取る
          const contentLength = parseInt(
            xhr.getResponseHeader("Content-Length")
          );

          //ヘッダのみで、データの読み込みは行わない
          xhr.abort();

          resolve(contentLength);
        }
      });
      xhr.addEventListener("error", () => {
        reject(0);
      });
      xhr.open("GET", url);
      xhr.send();
    });
  }

  loadXHR(elm, index) {
    const xhr = new XMLHttpRequest();
    //blobで読み込む場合
    //xhr.responseType = 'blob';
    this.addListeners(xhr, elm, index);
    xhr.open("GET", elm.dataset.src);
    xhr.send();
  }
}
