import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PCFSoftShadowMap,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  WebGLRenderer,
} from 'three';

export function mountProjectWorld(
  canvas: HTMLCanvasElement,
  select: (slug: string) => void,
) {
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
  if (!context) {
    console.warn(
      '3D world unavailable: WebGL2 is not supported. Showing static artwork.',
    );
    return;
  }
  const renderer = new WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  const scene = new Scene();
  const overview = new Group();
  scene.add(overview);
  const camera = new OrthographicCamera(-6, 6, 6, -6, 0.1, 60);
  camera.position.set(10, 11, 13);
  camera.lookAt(0, 0.5, 0);
  const material = (color: string) =>
    new MeshStandardMaterial({ color, roughness: 0.75 });
  const cream = material('#e8e9da');
  const teal = material('#397c70');
  const glass = material('#173f3c');
  const mint = material('#9ad9c7');
  const apricot = material('#efb98e');
  const paving = material('#a7bbae');
  const treeMaterial = material('#49745b');
  const box = (
    parent: Group | Scene,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    surface: MeshStandardMaterial,
  ) => {
    const mesh = new Mesh(new BoxGeometry(width, height, depth), surface);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  box(overview, 0, -0.25, 0, 8.6, 0.5, 7.2, paving);
  box(overview, 0, 0.02, 0, 8.45, 0.08, 7.05, cream);
  // A cross street joins five distinct model buildings; none represents a real office.
  box(overview, 0, 0.075, 0.2, 8.3, 0.025, 0.58, paving);
  box(overview, 0.25, 0.075, 0, 0.58, 0.025, 7, paving);
  for (let x = -3.5; x < 4; x += 0.75)
    box(overview, x, 0.092, 0.2, 0.3, 0.01, 0.045, cream);
  const buildings = new Map<string, Group>();
  function landmark(slug: string, x: number, z: number) {
    const group = new Group();
    group.position.set(x, 0.1, z);
    group.userData.slug = slug;
    overview.add(group);
    buildings.set(slug, group);
    box(group, 0, 0.04, 0, 2.1, 0.08, 2.1, paving);
    return group;
  }
  const recon = landmark('recon-desk', -2.25, 1.85);
  for (const x of [-0.48, 0.48]) {
    box(recon, x, 0.9, 0, 0.7, 1.7, 1.2, x < 0 ? teal : apricot);
    for (let y = 0.4; y < 1.7; y += 0.35)
      box(recon, x, y, 0.61, 0.5, 0.16, 0.025, glass);
    box(recon, x, 1.8, 0, 0.8, 0.13, 1.3, cream);
  }
  box(recon, 0, 1.15, 0, 0.5, 0.2, 0.4, mint);
  const ops = landmark('operations', -2.3, -1.6);
  box(ops, 0, 0.55, 0, 1.8, 1, 1.6, cream);
  box(ops, -0.3, 1.23, -0.3, 1.2, 0.4, 0.9, teal);
  for (const x of [-0.55, 0, 0.55]) {
    box(ops, x, 0.42, 0.81, 0.35, 0.6, 0.03, glass);
    box(ops, x, 1.08, 0.35, 0.4, 0.07, 0.6, apricot);
  }
  const crm = landmark('sales-crm', 2.35, -1.65);
  box(crm, 0, 1.35, 0, 1.05, 2.5, 1.1, teal);
  for (let y = 0.45; y < 2.65; y += 0.4) {
    box(crm, 0, y, 0.565, 0.85, 0.17, 0.035, mint);
    box(crm, 0.54, y, 0, 0.035, 0.17, 0.85, glass);
  }
  box(crm, 0, 2.65, 0, 1.2, 0.14, 1.25, cream);
  const mast = new Mesh(new CylinderGeometry(0.035, 0.035, 0.55, 8), glass);
  mast.position.set(0.2, 2.98, 0);
  crm.add(mast);
  const visualization = landmark('visualization', 2.4, 1.9);
  for (let level = 0; level < 3; level++) {
    const size = 1.65 - level * 0.3;
    box(
      visualization,
      -level * 0.12,
      0.4 + level * 0.52,
      0,
      size,
      0.46,
      size,
      level === 1 ? apricot : teal,
    );
    box(
      visualization,
      -level * 0.12,
      0.66 + level * 0.52,
      0,
      size + 0.14,
      0.08,
      size + 0.14,
      cream,
    );
  }
  const web = landmark('website-cms', 0.1, -2.15);
  box(web, 0, 0.5, 0, 1.1, 0.8, 1.1, glass);
  for (const x of [-0.65, 0.65])
    for (const z of [-0.65, 0.65]) box(web, x, 0.65, z, 0.1, 1.1, 0.1, cream);
  box(web, 0, 1.25, 0, 1.55, 0.2, 1.55, apricot);
  for (const [x, z] of [
    [-3.7, -2.8],
    [-3.8, 1],
    [3.7, 0.8],
    [1, 2.8],
    [-0.6, 2.9],
  ]) {
    if (x === undefined || z === undefined) continue;
    box(overview, x, 0.3, z, 0.07, 0.55, 0.07, glass);
    const crown = new Mesh(new SphereGeometry(0.27, 12, 8), treeMaterial);
    crown.position.set(x, 0.75, z);
    crown.scale.y = 1.25;
    crown.castShadow = true;
    overview.add(crown);
  }
  const models = new Map<string, Group>([['overview', overview]]);
  function model(slug: string) {
    const group = new Group();
    box(group, 0, -0.25, 0, 8.6, 0.5, 7.2, paving);
    box(group, 0, 0.02, 0, 8.45, 0.08, 7.05, cream);
    group.visible = false;
    models.set(slug, group);
    scene.add(group);
    return group;
  }
  const records = model('recon-desk');
  for (const x of [-2.2, 2.2]) {
    box(records, x, 0.2, 0, 2.3, 0.3, 3.5, paving);
    box(records, x, 2.9, -0.3, 2, 0.18, 0.85, teal);
    for (let row = 0; row < 3; row++) {
      const surface = row === 1 && x > 0 ? apricot : mint;
      box(records, x, 0.65 + row * 0.77, -0.3, 1.9, 0.58, 0.8, surface);
      for (let column = 0; column < 3; column++)
        box(
          records,
          x - 0.65 + column * 0.63,
          0.65 + row * 0.77,
          0.12,
          0.38,
          0.13,
          0.03,
          glass,
        );
      box(
        records,
        0,
        0.68 + row * 0.77,
        -0.3,
        2.5,
        0.07,
        0.08,
        row === 1 ? apricot : teal,
      );
    }
  }
  box(records, 0, 0.2, 2.1, 2.2, 0.25, 1.25, apricot);
  box(records, 0, 0.38, 2.1, 1.85, 0.12, 0.95, cream);

  const workflow = model('operations');
  box(workflow, -0.2, 0.1, 0, 6.8, 0.08, 0.5, paving);
  for (const [i, x] of [-2.65, 0, 2.65].entries()) {
    box(workflow, x, 0.7, -1.1, 1.65, 1.3, 1.55, i === 1 ? teal : cream);
    box(workflow, x, 1.45, -1.1, 1.85, 0.2, 1.75, i === 1 ? mint : apricot);
    box(workflow, x, 0.65, -0.31, 0.6, 0.9, 0.03, glass);
    box(workflow, x, 0.11, -0.1, 0.4, 0.08, 1.25, paving);
  }
  box(workflow, -1.9, 0.75, 1.65, 1.25, 1.5, 0.22, glass);
  box(workflow, -1.9, 0.8, 1.78, 1.05, 1.12, 0.03, mint);
  for (let row = 0; row < 3; row++)
    box(workflow, -1.9, 0.45 + row * 0.3, 1.81, 0.7, 0.11, 0.02, teal);
  for (let i = 0; i < 3; i++)
    box(workflow, -0.2 + i * 0.7, 0.2, 1.65, 0.5, 0.3, 0.65, apricot);
  box(workflow, 2.5, 0.32, 1.7, 1.3, 0.55, 0.8, teal);
  box(workflow, 3.1, 0.35, 1.7, 0.55, 0.65, 0.8, apricot);
  for (const x of [2.15, 2.9])
    for (const z of [1.25, 2.15]) {
      const wheel = new Mesh(new CylinderGeometry(0.17, 0.17, 0.15, 12), glass);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.17, z);
      workflow.add(wheel);
    }

  const calls = model('sales-crm');
  box(calls, -2.5, 1.2, 0.1, 1.8, 1.5, 0.22, glass);
  box(calls, -2.5, 1.25, 0.23, 1.55, 1.2, 0.03, mint);
  box(calls, -2.5, 0.35, 0.1, 0.15, 0.75, 0.15, teal);
  box(calls, -2.5, 0.1, 0.1, 1.3, 0.15, 0.65, glass);
  for (let i = 0; i < 3; i++)
    box(calls, -2.5, 0.9 + i * 0.33, 0.26, 1.2, 0.12, 0.02, teal);
  const tower = new Mesh(new CylinderGeometry(0.6, 0.75, 2.6, 24), teal);
  tower.position.set(0, 1.35, -1.3);
  tower.castShadow = true;
  calls.add(tower);
  for (const y of [0.5, 1.3, 2.1]) {
    const band = new Mesh(new CylinderGeometry(0.71, 0.71, 0.12, 24), mint);
    band.position.set(0, y, -1.3);
    calls.add(band);
  }
  box(calls, 2.4, 0.15, 0.1, 1.7, 0.25, 2, paving);
  box(calls, 2.4, 0.8, -0.4, 1.2, 0.4, 0.45, apricot);
  for (const x of [1.9, 2.9])
    box(calls, x, 0.55, -0.1, 0.4, 0.65, 0.7, apricot);
  box(calls, 0, 0.1, 1.7, 5.5, 0.08, 0.22, teal);
  for (const x of [-2.5, 0, 2.4])
    box(calls, x, 0.11, 0.9, 0.22, 0.08, 1.6, teal);
  for (const x of [-0.55, 0, 0.55])
    box(calls, x, 0.27, 2.45, 0.38, 0.38, 0.38, apricot);

  const hierarchy = model('visualization');
  for (let level = 0; level < 3; level++) {
    const width = 5.9 - level * 1.4;
    const depth = 4.7 - level * 1.1;
    box(
      hierarchy,
      0,
      0.25 + level * 0.7,
      -level * 0.3,
      width,
      0.16,
      depth,
      level === 1 ? mint : teal,
    );
    for (let x = -width / 2 + 0.5; x < width / 2; x += 0.9) {
      for (let z = -depth / 2 + 0.5; z < depth / 2; z += 0.9) {
        box(
          hierarchy,
          x,
          0.54 + level * 0.7,
          z - level * 0.3,
          0.65,
          0.42,
          0.65,
          level === 2 && x > 0 ? apricot : cream,
        );
      }
    }
  }

  const publishing = model('website-cms');
  for (const x of [-2.45, 2.45]) {
    box(publishing, x, 1.1, -0.6, 2.05, 1.95, 0.35, x < 0 ? teal : apricot);
    box(publishing, x, 1.1, -0.4, 1.78, 1.63, 0.04, cream);
    box(publishing, x, 1.53, -0.36, 1.5, 0.38, 0.025, mint);
    for (let row = 0; row < 3; row++)
      box(
        publishing,
        x - 0.12,
        0.65 + row * 0.22,
        -0.36,
        1.25,
        0.07,
        0.025,
        teal,
      );
    box(publishing, x, 0.12, -0.3, 2.3, 0.18, 1.2, paving);
  }
  box(publishing, 0, 0.4, -0.3, 2.8, 0.18, 0.55, mint);
  for (let page = 0; page < 3; page++)
    box(
      publishing,
      -0.1 + page * 0.12,
      0.25 + page * 0.15,
      1.8,
      1.8,
      0.1,
      1.25,
      page === 2 ? apricot : cream,
    );
  box(publishing, 2.45, 0.2, 2.1, 1.3, 0.3, 0.9, teal);
  scene.add(new AmbientLight('#fffdf7', 2.2));
  const sunlight = new DirectionalLight('#fff1df', 3.5);
  sunlight.position.set(-3, 9, 5);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, {
    left: -7,
    right: 7,
    top: 7,
    bottom: -7,
  });
  sunlight.shadow.normalBias = 0.04;
  scene.add(sunlight);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let visible = true;
  let lost = false;
  let active = 'overview';
  const draw = () => {
    if (lost) return;
    renderer.render(scene, camera);
    canvas.dataset.ready = 'true';
  };
  const canAnimate = () =>
    visible &&
    !lost &&
    !document.hidden &&
    !reduced.matches &&
    !document.body.classList.contains('motion-paused');
  const settle = () => {
    cancelAnimationFrame(frame);
    for (const group of models.values()) group.scale.setScalar(1);
    canvas.dataset.motion = 'paused';
    draw();
  };
  const update = () => {
    const next = canvas.dataset.selected ?? 'overview';
    const selected = models.get(next);
    if (!selected) return;
    const changed = active !== next;
    active = next;
    for (const [slug, group] of models) group.visible = slug === active;
    canvas.dataset.view = active;
    if (!changed || !canAnimate()) {
      settle();
      return;
    }
    cancelAnimationFrame(frame);
    const start = performance.now();
    const animate = (now: number) => {
      if (!canAnimate()) {
        settle();
        return;
      }
      const t = Math.min((now - start) / 280, 1);
      const ease = 1 - (1 - t) ** 3;
      selected.scale.setScalar(0.96 + 0.04 * ease);
      canvas.dataset.motion = t < 1 ? 'running' : 'paused';
      draw();
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
  };
  const picker = new Raycaster();
  canvas.addEventListener('click', (event) => {
    if (active !== 'overview') return;
    const bounds = canvas.getBoundingClientRect();
    picker.setFromCamera(
      new Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
      ),
      camera,
    );
    const hit = picker.intersectObjects([...buildings.values()], true)[0];
    let object = hit?.object;
    while (object && typeof object.userData.slug !== 'string')
      object = object.parent ?? undefined;
    if (object) select(String(object.userData.slug));
  });
  new ResizeObserver(() => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    camera.left = -5.9;
    camera.right = 5.9;
    camera.top = 5.9 / aspect;
    camera.bottom = -5.9 / aspect;
    camera.updateProjectionMatrix();
    draw();
  }).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    settle();
  }).observe(canvas);
  const selection = new MutationObserver(update);
  selection.observe(canvas, {
    attributes: true,
    attributeFilter: ['data-selected'],
  });
  const preference = new MutationObserver(settle);
  preference.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  });
  reduced.addEventListener('change', settle);
  document.addEventListener('visibilitychange', settle);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    delete canvas.dataset.ready;
    console.warn(
      '3D world context lost. Project links and static artwork remain available.',
    );
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    settle();
  });
  update();
}
