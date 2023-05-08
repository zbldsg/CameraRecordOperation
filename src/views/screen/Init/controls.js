import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

export function initOrbitControls(labelRenderer, camera) {
  let control = new OrbitControls(camera, labelRenderer.domElement)
  // control.autoRotate = true
  control.autoRotateSpeed = .2
  control.maxPolarAngle = Math.PI / 2

  control.enableDamping = true
  return control
}
