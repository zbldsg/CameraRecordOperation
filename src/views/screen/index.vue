<template>
  <div class="index">
    <div id="test" class="test"></div>

    <div style="position: absolute;left: 20px;top: 20px">
      <input type="checkbox" id="myCheckbox" v-model="isChecked" @change="handleChange">
      <label for="myCheckbox">开启旋转</label>
    </div>

    <div class="around-scene">
      <div style="display: flex;justify-content: space-between;margin: 20px 300px;">
        <div>
          <button style="margin-left: 10px" @click="playAll" v-show="list.length > 0">播放所有</button>
          <button style="margin-left: 10px" @click="play" v-show="clicked">播放</button>
          <button style="margin-left: 10px" @click="capturePic">截屏</button>
          <button style="margin-left: 10px" @click="del" v-show="clicked">删除</button>
          <button style="margin-left: 10px" @click="stopAnimation">停止动画</button>
        </div>

        <div v-if="clicked">
          <span>当前选中位置到下个位置的移动时间：</span>
          <input type="number" class="second-input" v-model="clicked.time">
        </div>
      </div>
      <div class="menu" id="menu" style="display: flex;">
        <div v-for="(item,index) in list" :key="index" style="text-align: center;border: 1px solid #606266"
             class="cap-block" :class="{active: uuid === item.uuid}">
          <img :src="item.imageURL" alt=""
               style="width: 160px;height: 97px;"
               @click="setClick(item)">
          <span style="display: inline-block;position: absolute;height: 20px;
          margin-left:-160px;margin-top: 100px;background: rgba(22,55,188,0.1);width: 160px">{{ index + 1 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as THREE from "three";
import {onWindowResize} from "./Common/resize";
import {initAll} from "./Init/init";
import {generateFloor} from "./Generate/floor";
import {TweenMax} from 'gsap/TweenMax'

const renderers = {
  renderer: null,
  labelRenderer: null,
};

const current = {
  scene: null,
  camera: null,
  orbitControls: null,
  data: null,
};

var dom;

// 所有场景List
const baseSceneData = {
  id: null,
  name: null,
  path: "./model/1.glb",
  init: false,
  camera: null,
  control: null,
  scene: null,
  sceneObject: null,
};

var allAnimation = []

var singleAnimationPosition = null, singleAnimationTarget = null
var allAnimationPosition = null, allAnimationTarget = null


export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "index",
  data() {
    return {
      list: [],
      clicked: null,
      uuid: null,
      baseCameraInfo: {
        position: null,
        lookAt: null,
      },
      currentIndex: 0,
      isChecked:false,
    }
  },
  created() {
  },
  mounted() {
    dom = document.querySelector("#test");
    window.onresize = () => {
      onWindowResize(current.camera, renderers.renderer, dom);
    };
    this.init();
  },
  methods: {
    handleChange() {
      current.orbitControls.autoRotate = this.isChecked
      // console.log(this.isChecked,'hhhh')
    },
    stopAnimation() {
      if (singleAnimationPosition) {
        singleAnimationPosition.kill();
        singleAnimationPosition = null
      }
      if (singleAnimationTarget) {
        singleAnimationTarget.kill();
        singleAnimationTarget = null
      }
      if (allAnimationPosition) {
        allAnimationPosition.kill();
        allAnimationPosition = null
      }
      if (allAnimationTarget) {
        allAnimationTarget.kill();
        allAnimationTarget = null
      }
    },
    setClick(item) {
      if (this.clicked && this.uuid === item.uuid) {
        this.clicked = null
        this.uuid = null
        return
      }
      this.clicked = item
      this.uuid = item.uuid
      this.time = item.time
    },
    del() {
      if (!this.uuid) {
        alert('请选中截图再点击删除')
      } else {
        let list = this.list.filter(item => {
          return item.uuid !== this.uuid
        })
        this.list = list
        this.clicked = null
        this.uuid = null
      }
    },
    capturePic() {
      renderers.renderer.render(current.scene, current.camera);
      let canvas = renderers.renderer.domElement;
      let image = canvas.toDataURL('image/png');

      let obj = {
        uuid: this.generateUuid(),
        position: JSON.parse(JSON.stringify(current.camera.position)),
        lookAt: JSON.parse(JSON.stringify(current.orbitControls.target)),
        imageURL: image,
        time: 5,
      }
      this.list.push(obj)

      //设置选中
      this.clicked = obj
      this.uuid = obj.uuid
      this.time = obj.time
    },
    init() {
      let data = {...baseSceneData};
      initAll(renderers, data, dom, current);
      this.baseCameraInfo.position = JSON.parse(JSON.stringify(current.camera.position))
      this.baseCameraInfo.lookAt = JSON.parse(JSON.stringify(current.orbitControls.target))
      generateFloor(data);
      this.animate();
    },
    animate() {
      this.render();
      requestAnimationFrame(() => {
        this.animate();
      });
    },
    render() {
      renderers.renderer.render(current.scene, current.camera);
      renderers.labelRenderer.render(current.scene, current.camera);
      // 更新控制器,开启相机旋转需要更新控制器
     current.orbitControls.update();
    },
    play() {
      let position = current.camera.position
      let target = current.orbitControls.target

      if (this.list.length === 1) {
        this.onlyOne(position, this.baseCameraInfo.position, target, this.baseCameraInfo.lookAt)
        this.setCameraPosition(this.clicked.position, this.clicked.lookAt, this.clicked.time)

      } else { // 这里分是选的第一个还是第二个或以上
        if (this.uuid === this.list[0].uuid) {
          this.onlyOne(position, this.baseCameraInfo.position, target, this.baseCameraInfo.lookAt)
          this.setCameraPosition(this.clicked.position, this.clicked.lookAt, this.clicked.time)
        } else {
          let index = this.list.findIndex(item => item.uuid === this.uuid)
          let base = this.list[index - 1]
          let target = this.clicked

          this.onlyOne(base.position, target.position, base.lookAt, target.lookAt, target.time)

          this.setCameraPosition(this.clicked.position, this.clicked.lookAt, this.clicked.time)
        }
      }
    },
    onlyOne(basePosition, targetPosition, baseLookAt, targetLookAt) {
      basePosition.x = targetPosition.x
      basePosition.y = targetPosition.y
      basePosition.z = targetPosition.z

      baseLookAt.x = targetLookAt.x
      baseLookAt.y = targetLookAt.y
      baseLookAt.z = targetLookAt.z
    },
    setCameraPosition(position, lookAt, time) {
      singleAnimationPosition = TweenMax.to(current.camera.position, time, {
        // delay: 1,// 延迟
        x: position.x,
        y: position.y,
        z: position.z,
        // ease: Power0.easeOut,
        onStart() {
          singleAnimationTarget = TweenMax.to(current.orbitControls.target, 1.5, {
            x: lookAt.x,
            y: lookAt.y,
            z: lookAt.z,
            // ease: Sine.easeOut,
            onUpdate() {
              current.orbitControls.update()
            }
          })
        },
        onUpdate() {
          current.camera.lookAt(lookAt.x, lookAt.y, lookAt.z)
          current.camera.updateProjectionMatrix()
          current.orbitControls.update()
        }
      })
    },
    generateUuid() {
      let s = [];
      let hexDigits = "0123456789abcdef";
      for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
      }
      s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
      s[8] = s[13] = s[18] = s[23] = "-";

      let uuid = s.join("");
      return uuid;
    },
    playAll() {
      allAnimation = [...this.list]

      //循环完动画, 需要回到初始位置
      let endAnimation = {
        uuid: this.generateUuid(),
        position: JSON.parse(JSON.stringify(this.baseCameraInfo.position)),
        lookAt: JSON.parse(JSON.stringify(this.baseCameraInfo.lookAt)),
        time: 5,
      }
      allAnimation.push(endAnimation)

      //首先将相机视角设为初始值
      let position = current.camera.position
      let target = current.orbitControls.target
      position.x = this.baseCameraInfo.position.x
      position.y = this.baseCameraInfo.position.y
      position.z = this.baseCameraInfo.position.z

      target.x = this.baseCameraInfo.lookAt.x
      target.y = this.baseCameraInfo.lookAt.y
      target.z = this.baseCameraInfo.lookAt.z

      console.log(allAnimation, '所有动画')
      this.loopAnimation()
    },
    loopAnimation() {
      // 如果当前索引大于或等于目标数组的长度，则将索引重置为 0
      if (this.currentIndex > (allAnimation.length - 1)) {
        this.currentIndex = 0
      }

      // 获取当前要执行动画的目标对象
      const data = allAnimation[this.currentIndex];
      let _this = this

      allAnimationPosition = TweenMax.to(current.camera.position, data.time, {
        // delay: this.currentIndex === 0 ? 1 : 0,// 延迟
        x: data.position.x,
        y: data.position.y,
        z: data.position.z,
        // ease: Power0.easeOut,
        onStart() {
          allAnimationTarget = TweenMax.to(current.orbitControls.target, 1.5, {
            x: data.lookAt.x,
            y: data.lookAt.y,
            z: data.lookAt.z,
            // ease: Sine.easeOut,
            onUpdate() {
              current.orbitControls.update()
            }
          })
        },
        onUpdate() {
          current.camera.lookAt(data.lookAt.x, data.lookAt.y, data.lookAt.z)
          current.camera.updateProjectionMatrix()
          current.orbitControls.update()
        },
        onComplete() {
          // 当动画完成后，递归调用自身，继续执行下一个目标对象的动画
          _this.currentIndex++;
          _this.loopAnimation();
        }
      })
    },
  },
}
</script>

<style lang="less">
body {
  margin: 0;
  padding: 0;
}

.test {
  margin-left: 300px;
  //width: 100vw;
  //height: 100vh;
  width: calc(100vw - 600px);
  height: calc(100vh - 300px);
  overflow: hidden;
  background-color: #070a2b;
  background-size: 100%;
}

.around-scene {
  margin-top: 20px;

  .second-input {

  }

  .menu {
    background: rgba(34, 47, 84, 0.3);
    width: 100%;
    height: 120px;

    .cap-block:hover {
      cursor: pointer;
      box-shadow: 0 0 10px 5px rgba(34, 47, 84, 0.8);
    }

    .active {
      border: 2px solid #ff0000;
      box-shadow: 0 0 10px 5px rgba(255, 11, 55, 0.5);
    }
  }
}

</style>
