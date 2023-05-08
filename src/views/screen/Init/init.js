import * as THREE from 'three'
import {createRenderer, createLabelRenderer} from './renderer'
import {createCamera} from './camera'
import {createLight} from './light'
import {initOrbitControls} from './controls'
import {copyDataToCurrent} from "../Common/copyToCurrent";

function initRenderer(renderers, dom) {
  renderers.renderer = createRenderer(dom)
  renderers.labelRenderer = createLabelRenderer(dom)
}

function initScene(data) {
  data.scene = new THREE.Scene()
  data.sceneOrtho = new THREE.Scene()
  const axesHelper = new THREE.AxesHelper(10);
  data.sceneOrtho.add(axesHelper);
  // let urls = ['color.png','color.png','color.png','color.png','color.png','color.png',]
  // let loader = new THREE.CubeTextureLoader()
  // loader.setPath('./images/')
  // let background = loader.load(urls)
  // data.sceneOrtho.background = background
}

function initCamera(data) {
  data.camera = createCamera(0, 15, 15)
  data.cameraOrtho = createCamera(0, 15, 15)
}

function initControl(renderers, data) {
  data.orbitControls = initOrbitControls(renderers.labelRenderer, data.camera)
}

function initLight(data) {
  createLight(data.scene)
}

export function initAll(renderers, data, dom, current) {
  initRenderer(renderers, dom)
  initScene(data)
  initCamera(data)
  initControl(renderers, data)
  initLight(data)
  copyDataToCurrent(current, data)
}