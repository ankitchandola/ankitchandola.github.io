import {
  BoxGeometry,
  Box3,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  cityDestinations,
  cityFutureSpaces,
  type CityDestinationId,
} from '../content/city';

export interface CityLandmark {
  id: CityDestinationId;
  anchor: Vector3;
  bounds: Box3;
}

export function createCity() {
  const city = new Group();
  const landmarks: CityLandmark[] = [];
  const occluders: { bounds: Box3; id?: CityDestinationId }[] = [];
  const parts: Mesh<BufferGeometry, MeshStandardMaterial>[] = [];
  const material = (color: string, roughness = 0.8) =>
    new MeshStandardMaterial({ color, roughness, vertexColors: true });
  const cream = material('#eee5d2');
  const white = material('#fffaf0');
  const teal = material('#245e58');
  const apricot = material('#e6ad85');
  const glass = material('#294e4d', 0.45);
  const paving = material('#d6d3c2');
  const road = material('#8d9c94');
  const wood = material('#b18d66');
  const leaves = material('#66876a');
  const lightLeaves = material('#829974');
  const water = material('#78b8ab', 0.32);
  const sand = material('#e3d6b8', 0.95);
  const stone = material('#b9b5a3', 0.9);
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 768;
  const context = signCanvas.getContext('2d');
  if (!context) throw new Error('City sign artwork requires a 2D canvas.');
  context.fillStyle = '#fffaf0';
  context.fillRect(0, 0, 1024, 768);
  context.fillStyle = '#245e58';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 84px Label, sans-serif';
  const rowHeight = 128;
  const signSpans = [
    'ac',
    ...cityDestinations.map(({ name }) => name),
    cityFutureSpaces[0].name,
  ].map((name, index) => {
    context.fillText(name, 512, index * rowHeight + 64);
    return Math.min(1024, context.measureText(name).width + 56);
  });
  const texture = new CanvasTexture(signCanvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  const lettering = new MeshStandardMaterial({
    vertexColors: true,
    map: texture,
    side: DoubleSide,
    roughness: 0.8,
  });

  // Boards take their width from the lettering, so names keep their proportions.
  function sign(
    parent: Group,
    row: number,
    y: number,
    z: number,
    height = 0.2,
    frame = teal,
  ) {
    const span = signSpans[row] ?? 1024;
    const width = (height * span) / rowHeight;
    box(parent, 0, y, z, width + 0.08, height + 0.07, 0.06, frame, 0.018);
    const geometry = new PlaneGeometry(width, height);
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) {
      uv.setX(i, (1 - span / 1024) / 2 + (uv.getX(i) * span) / 1024);
      uv.setY(i, (5 - row + uv.getY(i)) / 6);
    }
    mesh(parent, geometry, lettering, 0, y, z + 0.032);
    return width;
  }
  // Rooftop boards turn toward the default overview camera so names read without a label.
  function roofSign(
    parent: Group,
    row: number,
    y: number,
    z: number,
    { height = 0.38, frame = teal, bulbs = false } = {},
  ) {
    const holder = new Group();
    holder.position.set(0, y, z);
    holder.rotation.y = 0.62;
    parent.add(holder);
    const centre = 0.22 + height / 2;
    const width = sign(holder, row, centre, 0, height, frame);
    for (const side of [-1, 1])
      box(holder, side * width * 0.35, 0.11, 0, 0.04, 0.22, 0.04, frame);
    if (!bulbs) return;
    const count = Math.round(width / 0.1);
    for (let i = 0; i <= count; i++)
      for (const edge of [-1, 1])
        mesh(
          holder,
          new SphereGeometry(0.022, 6, 4),
          white,
          -width / 2 + (i * width) / count,
          centre + edge * (height / 2 + 0.035),
          0.04,
        );
  }

  function mesh(
    parent: Group,
    geometry: BufferGeometry,
    surface: MeshStandardMaterial,
    x: number,
    y: number,
    z: number,
  ) {
    const object = new Mesh(geometry, surface);
    object.position.set(x, y, z);
    parent.add(object);
    parts.push(object);
    return object;
  }
  function box(
    parent: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    surface: MeshStandardMaterial,
    bevel = 0,
  ) {
    return mesh(
      parent,
      bevel
        ? new RoundedBoxGeometry(w, h, d, 2, bevel)
        : new BoxGeometry(w, h, d),
      surface,
      x,
      y,
      z,
    );
  }
  function cylinder(
    parent: Group,
    x: number,
    y: number,
    z: number,
    radius: number,
    height: number,
    surface: MeshStandardMaterial,
    top = radius,
  ) {
    return mesh(
      parent,
      new CylinderGeometry(top, radius, height, 20),
      surface,
      x,
      y,
      z,
    );
  }
  function group(x: number, z: number, rotation = 0) {
    const result = new Group();
    result.position.set(x, 0.13, z);
    result.rotation.y = rotation;
    city.add(result);
    return result;
  }
  function planter(
    parent: Group,
    x: number,
    y: number,
    z: number,
    size = 0.25,
  ) {
    box(parent, x, y + 0.09, z, size, 0.18, size, cream, 0.025);
    mesh(
      parent,
      new SphereGeometry(size * 0.43, 10, 8),
      leaves,
      x,
      y + 0.21,
      z,
    );
  }
  function tree(x: number, z: number, height = 1.2) {
    occluders.push({
      bounds: new Box3(
        new Vector3(x - 0.38, height * 0.55, z - 0.34),
        new Vector3(x + 0.34, height + 0.4, z + 0.34),
      ),
    });
    const plant = group(x, z);
    cylinder(plant, 0, 0.04, 0, 0.29, 0.08, cream);
    cylinder(plant, 0, height * 0.38, 0, 0.045, height * 0.7, wood);
    const canopy = mesh(
      plant,
      new SphereGeometry(0.34, 14, 10),
      leaves,
      0,
      height * 0.78,
      0,
    );
    canopy.scale.set(1, 1.25, 1);
    mesh(
      plant,
      new SphereGeometry(0.24, 12, 8),
      lightLeaves,
      -0.15,
      height * 0.93,
      0.06,
    );
  }
  function bench(parent: Group, x: number, z: number, rotation = 0) {
    const seat = new Group();
    seat.position.set(x, 0, z);
    seat.rotation.y = rotation;
    parent.add(seat);
    for (const offset of [-0.075, 0, 0.075])
      box(seat, 0, 0.22, offset, 0.68, 0.04, 0.06, wood, 0.012);
    box(seat, 0, 0.4, -0.12, 0.68, 0.18, 0.045, wood, 0.012);
    for (const side of [-1, 1]) {
      box(seat, side * 0.24, 0.12, 0, 0.045, 0.22, 0.26, teal);
      box(seat, side * 0.24, 0.32, -0.12, 0.035, 0.24, 0.035, teal);
    }
  }
  function terrace(parent: Group, w: number, d: number, y: number) {
    box(parent, 0, y, 0, w + 0.12, 0.13, d + 0.12, white, 0.035);
    box(parent, 0, y + 0.07, 0, w - 0.13, 0.025, d - 0.13, paving);
    for (const side of [-1, 1]) {
      box(parent, 0, y + 0.15, (side * d) / 2, w, 0.2, 0.075, cream);
      box(parent, (side * w) / 2, y + 0.15, 0, 0.075, 0.2, d, cream);
    }
    box(parent, -w * 0.2, y + 0.2, -d * 0.2, 0.42, 0.26, 0.3, white, 0.035);
    for (const offset of [-0.1, 0, 0.1])
      box(
        parent,
        -w * 0.2 + offset,
        y + 0.335,
        -d * 0.2,
        0.04,
        0.015,
        0.22,
        teal,
      );
    planter(parent, w * 0.28, y + 0.09, -d * 0.27);
  }
  // A rounded, slightly irregular coast around the town plate; deterministic so the poster matches.
  function coastline() {
    const points: Vector2[] = [];
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const c = Math.cos(angle);
      const n = Math.sin(angle);
      const radius =
        Math.pow(Math.abs(c / 7.3) ** 4 + Math.abs(n / 6.4) ** 4, -1 / 4) *
        (1 + 0.035 * Math.sin(3 * angle + 1) + 0.025 * Math.sin(5 * angle + 2));
      points.push(new Vector2(radius * c, -radius * n));
    }
    return new Shape(points);
  }
  // North-light workshop roof: glazed faces step towards the front of the building.
  function sawtooth(parent: Group, w: number, d: number, y: number) {
    const teeth = 2;
    const front = 0.45;
    const rise = 0.42;
    const span = (d - front) / teeth;
    const gable = new ExtrudeGeometry(
      new Shape([
        new Vector2(0, 0),
        new Vector2(span, 0),
        new Vector2(span, rise),
      ]),
      { depth: 0.05, bevelEnabled: false },
    );
    for (let i = 0; i < teeth; i++) {
      const back = -d / 2 + i * span;
      const edge = back + span;
      box(parent, 0, y + rise / 2, edge - 0.025, w - 0.1, rise, 0.04, glass);
      for (let m = -2; m <= 2; m++)
        box(
          parent,
          (m * (w - 0.1)) / 4,
          y + rise / 2,
          edge,
          0.035,
          rise,
          0.05,
          teal,
        );
      box(parent, 0, y + rise, edge, w, 0.05, 0.08, teal, 0.015);
      const slope = box(
        parent,
        0,
        y + rise / 2,
        back + span / 2,
        w,
        0.05,
        Math.hypot(span, rise),
        cream,
        0.015,
      );
      slope.rotation.x = -Math.atan2(rise, span);
      for (const side of [-1, 1]) {
        const end = mesh(
          parent,
          gable,
          cream,
          side > 0 ? w / 2 : -w / 2 + 0.05,
          y,
          back,
        );
        end.rotation.y = -Math.PI / 2;
      }
    }
  }
  function building(
    x: number,
    z: number,
    w: number,
    d: number,
    height: number,
    floors: number,
    {
      surface = cream,
      rotation = 0,
      balconies = false,
      id,
      roof = true,
      crown = 0,
    }: {
      surface?: MeshStandardMaterial;
      rotation?: number;
      balconies?: boolean;
      id?: CityDestinationId;
      roof?: boolean;
      crown?: number;
    } = {},
  ) {
    const building = group(x, z, rotation);
    const width = rotation ? d : w;
    const depth = rotation ? w : d;
    const top = height + 0.45 + crown;
    const bounds = new Box3(
      new Vector3(x - width / 2 - 0.08, 0.13, z - depth / 2 - 0.08),
      new Vector3(x + width / 2 + 0.08, top, z + depth / 2 + 0.08),
    );
    occluders.push({ bounds, id });
    if (id)
      landmarks.push({ id, bounds, anchor: new Vector3(x, top + 0.1, z) });
    box(building, 0, 0.035, 0, w + 0.18, 0.07, d + 0.18, white, 0.035);
    // The glazing sits behind the structural piers and floor bands, not on painted walls.
    box(
      building,
      0,
      height / 2,
      0,
      w - 0.16,
      height - 0.06,
      d - 0.16,
      glass,
      0.035,
    );
    const floorHeight = height / floors;
    for (let side = 0; side < 4; side++) {
      const facade = new Group();
      facade.rotation.y = (side * Math.PI) / 2;
      building.add(facade);
      const width = side % 2 ? d : w;
      const depth = side % 2 ? w : d;
      const bays = Math.round(width / 0.48);
      for (let floor = 0; floor <= floors; floor++)
        box(
          facade,
          0,
          floor * floorHeight + 0.04,
          depth / 2,
          width,
          balconies ? 0.2 : 0.12,
          0.13,
          surface,
          0.02,
        );
      for (let column = 0; column <= bays; column++)
        box(
          facade,
          -width / 2 + (column * width) / bays,
          height / 2,
          depth / 2,
          balconies ? 0.16 : 0.11,
          height,
          0.13,
          surface,
          0.025,
        );
      for (let floor = 0; floor < floors; floor++) {
        for (let column = 0; column < bays; column++) {
          const cx = -width / 2 + ((column + 0.5) * width) / bays;
          box(
            facade,
            cx,
            floor * floorHeight + 0.14,
            depth / 2 + 0.035,
            width / bays - 0.12,
            0.035,
            0.17,
            white,
          );
          if (floor > 0)
            box(
              facade,
              cx,
              (floor + 0.5) * floorHeight,
              depth / 2 - 0.045,
              0.024,
              floorHeight - 0.14,
              0.025,
              cream,
            );
        }
      }
    }
    box(building, 0, 0.28, d / 2 + 0.015, 0.28, 0.49, 0.1, teal);
    box(building, 0.07, 0.25, d / 2 + 0.075, 0.018, 0.11, 0.018, apricot);
    box(building, 0, 0.045, d / 2 + 0.17, 0.5, 0.09, 0.26, white, 0.02);
    if (balconies) {
      for (let floor = 1; floor < floors; floor++) {
        for (const side of [-1, 1]) {
          const cx = side * w * 0.26;
          const y = floor * floorHeight + 0.05;
          box(building, cx, y, d / 2 + 0.15, w * 0.43, 0.09, 0.4, white, 0.025);
          box(
            building,
            cx,
            y + 0.26,
            d / 2 + 0.34,
            w * 0.43,
            0.035,
            0.04,
            teal,
          );
          for (const offset of [-0.24, 0, 0.24])
            box(
              building,
              cx + offset,
              y + 0.15,
              d / 2 + 0.34,
              0.025,
              0.24,
              0.025,
              teal,
            );
          planter(building, cx + w * 0.11, y + 0.05, d / 2 + 0.18, 0.15);
        }
      }
    }
    if (roof) terrace(building, w, d, height + 0.04);
    else
      box(
        building,
        0,
        height + 0.04,
        0,
        w + 0.12,
        0.13,
        d + 0.12,
        white,
        0.035,
      );
    if (balconies) {
      const roof = new Group();
      roof.position.set(0, height + 0.12, d * 0.15);
      building.add(roof);
      box(roof, 0, 0.025, 0, w * 0.7, 0.04, d * 0.43, wood);
      bench(roof, 0, -0.08);
      planter(roof, -w * 0.34, 0.02, d * 0.15, 0.2);
    }
    return building;
  }

  box(city, 0, -0.23, 0, 12.1, 0.46, 10, cream, 0.2);
  const coast = coastline();
  const shore = new ExtrudeGeometry(coast, {
    depth: 0.35,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.14,
    bevelSegments: 3,
  });
  shore.rotateX(-Math.PI / 2);
  mesh(city, shore, sand, 0, -0.56, 0);
  for (const [x, z, size, turn] of [
    [-7.1, -2.2, 0.42, 0.4],
    [-6.7, -1.5, 0.28, 1.2],
    [6.9, 3.6, 0.38, 2.1],
    [7.35, 2.9, 0.24, 0.8],
    [3.8, -6.5, 0.34, 1.7],
  ] as const) {
    const rock = mesh(
      city,
      new IcosahedronGeometry(size, 0),
      stone,
      x,
      -0.3,
      z,
    );
    rock.rotation.set(turn, turn * 1.7, turn * 0.6);
    rock.scale.set(1.25, 0.8, 1);
  }
  const pier = group(-1.4, 6.9);
  pier.position.y = 0;
  box(pier, 0, -0.06, 0, 0.82, 0.08, 4.1, wood, 0.02);
  for (let i = 0; i < 6; i++)
    for (const side of [-1, 1])
      cylinder(pier, side * 0.36, -0.3, -1.85 + i * 0.74, 0.05, 0.5, wood);
  cylinder(pier, 0.3, 0.25, 1.9, 0.025, 0.6, teal);
  box(pier, 0.3, 0.58, 1.9, 0.12, 0.12, 0.12, cream, 0.02);
  const boat = group(-0.55, 7.7);
  boat.position.y = 0;
  box(boat, 0, -0.27, 0, 0.5, 0.2, 1.35, white, 0.08);
  box(boat, 0, -0.2, 0, 0.52, 0.035, 1.37, teal, 0.015);
  box(boat, 0, -0.08, -0.15, 0.32, 0.2, 0.42, cream, 0.03);
  cylinder(boat, 0, 0.3, 0.2, 0.018, 0.95, wood);
  box(city, 0, 0.015, 0, 11.6, 0.06, 9.5, road, 0.3);
  box(city, 0, 0.075, 0, 9.2, 0.12, 7.1, paving, 0.16);
  for (const side of [-1, 1]) {
    box(city, side * 5.75, 0.065, 0, 0.24, 0.1, 9.45, white, 0.06);
    box(city, 0, 0.065, side * 4.62, 11.65, 0.1, 0.24, white, 0.06);
    for (let i = -4; i <= 4; i++)
      box(city, i * 0.92, 0.049, side * 4.03, 0.42, 0.008, 0.035, cream);
    for (let i = -3; i <= 3; i++)
      box(city, side * 5.15, 0.049, i, 0.035, 0.008, 0.42, cream);
    for (let i = -3; i <= 3; i++)
      box(city, i * 0.17, 0.052, side * 4.03, 0.09, 0.01, 0.88, white);
  }
  box(city, 0, 0.145, 0, 3.5, 0.05, 2.55, cream, 0.07);
  for (let i = -3; i <= 3; i++) {
    box(city, i * 0.45, 0.173, 0, 0.015, 0.005, 2.35, paving);
    box(city, 0, 0.174, i * 0.35, 3.35, 0.005, 0.015, paving);
  }
  cylinder(city, 0, 0.24, -0.05, 0.6, 0.13, white);
  cylinder(city, 0, 0.314, -0.05, 0.5, 0.02, water);
  cylinder(city, 0, 0.4, -0.05, 0.13, 0.2, cream);
  cylinder(city, 0, 0.5, -0.05, 0.22, 0.07, white);
  const plaza = group(0, 0);
  bench(plaza, -1.1, -0.2, Math.PI / 2);
  bench(plaza, 1.1, -0.2, -Math.PI / 2);
  bench(plaza, 0, 0.9, Math.PI);

  const studio = building(-2.65, -2.35, 1.75, 1.35, 2.35, 3, {
    id: 'studio',
    roof: false,
    crown: 0.25,
  });
  box(studio, 0, 0.74, 0.85, 1.55, 0.1, 0.6, teal, 0.035);
  sign(studio, 0, 0.98, 0.72, 0.26);
  sawtooth(studio, 1.75, 1.35, 2.45);
  roofSign(studio, 1, 2.45, 0.45);
  const office = building(0, -2.3, 1.75, 1.5, 3.95, 6, {
    id: 'journey',
    crown: 1,
  });
  for (const side of [-1, 1])
    box(office, side * 0.82, 2, 0.82, 0.13, 4, 0.15, teal, 0.035);
  sign(office, 2, 0.94, 0.86);
  const tower = new Group();
  tower.position.set(0, 4.05, -0.2);
  office.add(tower);
  box(tower, 0, 0.42, 0, 0.62, 0.84, 0.62, cream, 0.03);
  box(tower, 0, 0.88, 0, 0.74, 0.08, 0.74, teal, 0.02);
  const spire = mesh(tower, new ConeGeometry(0.5, 0.42, 4), teal, 0, 1.13, 0);
  spire.rotation.y = Math.PI / 4;
  for (let side = 0; side < 4; side++) {
    const face = new Group();
    face.rotation.y = (side * Math.PI) / 2;
    tower.add(face);
    const dial = cylinder(face, 0, 0.5, 0.32, 0.21, 0.03, teal);
    dial.rotation.x = Math.PI / 2;
    const plate = cylinder(face, 0, 0.5, 0.34, 0.18, 0.02, white);
    plate.rotation.x = Math.PI / 2;
    box(face, 0, 0.56, 0.355, 0.025, 0.13, 0.012, teal);
    box(face, 0.045, 0.5, 0.355, 0.1, 0.025, 0.012, teal);
  }
  roofSign(office, 2, 4.05, 0.5);
  const station = new Group();
  station.position.set(0, 0, 1.2);
  office.add(station);
  box(station, 0, 0.05, 0, 1.7, 0.08, 0.66, white, 0.02);
  box(station, 0, 0.64, 0, 1.6, 0.07, 0.62, teal, 0.03);
  for (const x of [-0.7, 0.7]) cylinder(station, x, 0.34, 0.2, 0.03, 0.6, teal);
  building(2.65, -2.35, 1.65, 1.35, 2.65, 4, { balconies: true });
  building(-3.45, -0.1, 1.5, 1.4, 1.75, 2, {
    surface: white,
    rotation: Math.PI / 2,
  });
  function futurePlot(x: number, z: number, floors: number) {
    const plot = group(x, z);
    const height = floors * 0.6;
    occluders.push({
      bounds: new Box3(
        new Vector3(x - 0.85, 0.13, z - 0.75),
        new Vector3(x + 0.85, height + 0.35, z + 0.75),
      ),
    });
    for (let floor = 0; floor <= floors; floor++)
      box(plot, 0, floor * 0.6 + 0.04, 0, 1.45, 0.1, 1.3, cream, 0.02);
    for (const side of [-1, 1]) {
      for (const depth of [-0.52, 0.52]) {
        box(plot, side * 0.6, height / 2, depth, 0.1, height, 0.1, cream);
        cylinder(
          plot,
          side * 0.8,
          height / 2 + 0.15,
          depth,
          0.025,
          height + 0.3,
          teal,
        );
      }
      for (let floor = 1; floor <= floors; floor++) {
        box(plot, side * 0.8, floor * 0.6, 0, 0.035, 0.035, 1.4, teal);
        const brace = box(
          plot,
          side * 0.8,
          floor * 0.6 - 0.3,
          0,
          0.025,
          0.025,
          1.2,
          teal,
        );
        brace.rotation.x = 0.45;
      }
    }
    box(plot, 0, 0.18, 0.7, 1.55, 0.3, 0.055, wood);
    sign(plot, 5, 0.41, 0.76, 0.22);
  }
  futurePlot(3.45, -0.1, 3);
  futurePlot(-3.45, 2.2, 1);
  const arcade = building(3.45, 2.2, 1.35, 1.15, 1.35, 2, {
    surface: white,
    id: 'arcade',
    roof: false,
    crown: 0.25,
  });
  const vault = new CylinderGeometry(0.4, 0.4, 1.25, 20, 1, false, 0, Math.PI);
  vault.rotateZ(Math.PI / 2);
  mesh(arcade, vault, teal, 0, 1.45, -0.12);
  for (let rib = -2; rib <= 2; rib++) {
    const hoop = new CylinderGeometry(
      0.415,
      0.415,
      0.04,
      20,
      1,
      true,
      0,
      Math.PI,
    );
    hoop.rotateZ(Math.PI / 2);
    mesh(arcade, hoop, apricot, rib * 0.29, 1.45, -0.12);
  }
  roofSign(arcade, 3, 1.45, 0.42, { frame: apricot, bulbs: true });
  box(arcade, 0, 0.55, 0.65, 0.6, 0.13, 0.24, apricot, 0.03);
  box(arcade, 0, 1.04, 0.68, 0.54, 0.035, 0.04, apricot);
  box(arcade, 0.25, 0.86, 0.68, 0.035, 0.38, 0.04, apricot);
  const mirror = box(arcade, 0.25, 1.04, 0.7, 0.28, 0.04, 0.06, teal);
  mirror.rotation.z = -Math.PI / 4;

  const cafe = building(-1.4, 2.15, 1.55, 1.15, 0.95, 1, {
    id: 'contact',
    crown: 0.25,
  });
  roofSign(cafe, 4, 1.05, 0.42);
  for (let stripe = 0; stripe < 7; stripe++) {
    const awning = box(
      cafe,
      -0.66 + stripe * 0.22,
      0.83,
      0.84,
      0.22,
      0.06,
      0.6,
      stripe % 2 ? white : apricot,
    );
    awning.rotation.x = 0.16;
    box(
      cafe,
      -0.66 + stripe * 0.22,
      0.72,
      1.12,
      0.22,
      0.17,
      0.04,
      stripe % 2 ? white : apricot,
    );
  }
  box(cafe, 0, 1.18, -0.05, 0.8, 0.08, 0.5, wood, 0.025);
  for (const side of [-1, 1]) planter(cafe, side * 0.59, 1.08, 0.33, 0.2);
  const cafePatio = group(-1.4, 3.18);
  for (const side of [-1, 1]) {
    cylinder(cafePatio, side * 0.56, 0.25, 0, 0.16, 0.035, white);
    cylinder(cafePatio, side * 0.56, 0.47, 0, 0.022, 0.72, teal);
    mesh(
      cafePatio,
      new ConeGeometry(0.32, 0.14, 8),
      side > 0 ? apricot : white,
      side * 0.56,
      0.86,
      0,
    );
    for (const seat of [-1, 1])
      cylinder(
        cafePatio,
        side * 0.56 + seat * 0.23,
        0.13,
        0,
        0.08,
        0.055,
        apricot,
      );
  }

  const pavilion = group(1.4, 2.1);
  occluders.push({
    bounds: new Box3(
      new Vector3(0.42, 0.13, 1.32),
      new Vector3(2.38, 1.3, 2.88),
    ),
  });
  box(pavilion, 0, 0.045, 0, 1.7, 0.09, 1.3, white, 0.05);
  for (const x of [-0.67, 0.67])
    for (const z of [-0.44, 0.44])
      cylinder(pavilion, x, 0.49, z, 0.06, 0.9, teal);
  box(pavilion, 0, 0.97, 0, 1.95, 0.17, 1.55, teal, 0.08);
  box(pavilion, 0, 1.075, 0, 1.6, 0.06, 1.2, cream, 0.04);
  for (let i = -3; i <= 3; i++)
    box(pavilion, i * 0.21, 1.13, 0, 0.09, 0.055, 1.05, wood, 0.015);
  bench(pavilion, 0, -0.24);
  planter(pavilion, 0.58, 0.09, 0.4, 0.25);
  planter(pavilion, -0.58, 0.09, 0.4, 0.25);

  for (const [x, z, h] of [
    [-1.45, -1.13, 1],
    [1.45, -1.13, 1.1],
    [-2.2, 0.4, 1.2],
    [2.2, 0.4, 1.15],
    [-4.2, -1.4, 1.25],
    [4.2, -1.4, 1.3],
    [-4.2, 1.1, 1.15],
    [4.2, 1.1, 1.2],
    [-4.05, 3.1, 1],
    [4.05, 3.1, 1],
  ] as const)
    tree(x, z, h);
  for (const x of [-2.25, 2.25]) {
    for (const z of [-1.1, 1.35]) {
      cylinder(city, x, 0.53, z, 0.027, 0.8, teal);
      box(city, x, 0.96, z, 0.16, 0.11, 0.16, cream, 0.025);
      box(city, x, 1.035, z, 0.2, 0.04, 0.2, teal, 0.018);
    }
  }
  for (const x of [-0.58, 0.58])
    box(city, x, 0.22, 3.38, 0.045, 0.22, 0.045, teal, 0.015);

  // Static scenery is batched by material so hundreds of small details cost few draw calls.
  city.updateMatrixWorld(true);
  const batches = new Map<MeshStandardMaterial, BufferGeometry[]>();
  for (const object of parts) {
    const geometry = object.geometry.index
      ? object.geometry.toNonIndexed()
      : object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    bakeContactShade(geometry);
    const batch = batches.get(object.material) ?? [];
    batch.push(geometry);
    batches.set(object.material, batch);
    object.geometry.dispose();
  }
  const result = new Group();
  const waterSurface = createWater(coast);
  result.add(...waterSurface.meshes);
  for (const [surface, geometries] of batches) {
    const geometry = mergeGeometries(geometries);
    for (const part of geometries) part.dispose();
    if (!geometry) throw new Error('Could not batch city geometry.');
    const object = new Mesh(geometry, surface);
    object.castShadow = true;
    object.receiveShadow = true;
    result.add(object);
  }
  const glow = new Color('#ffc477');
  return {
    group: result,
    landmarks,
    occluders,
    // Dusk lights the glazing from inside and darkens the sea; geometry is unchanged.
    setDusk(dusk: boolean) {
      glass.emissive.copy(dusk ? glow : new Color(0));
      glass.emissiveIntensity = dusk ? 0.85 : 0;
      waterSurface.paint(dusk);
    },
    setOpenWater: (open: boolean) => waterSurface.setOpen(open),
  };
}

// Vertical faces darken towards their base, so walls read as standing on the ground without
// a per-frame occlusion pass.
function bakeContactShade(geometry: BufferGeometry) {
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const upright = Math.abs(normal.getY(i)) < 0.6;
    const lift = Math.min(1, Math.max(0, (position.getY(i) - 0.1) / 0.75));
    const shade = upright ? 0.7 + 0.3 * lift * lift * (3 - 2 * lift) : 1;
    colors.set([shade, shade, shade], i * 3);
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
}

export const seaColours = {
  day: { shallow: '#a9d6cb', deep: '#6aa7a0' },
  dusk: { shallow: '#2f5d5d', deep: '#163538' },
} as const;

function createWater(coast: Shape) {
  const size = 80;
  const half = size / 2;
  const paintCanvas = document.createElement('canvas');
  paintCanvas.width = paintCanvas.height = 512;
  const fadeCanvas = document.createElement('canvas');
  fadeCanvas.width = fadeCanvas.height = 256;
  const paint = paintCanvas.getContext('2d');
  const fade = fadeCanvas.getContext('2d');
  if (!paint || !fade) throw new Error('City water requires a 2D canvas.');
  // The compact hero fades the sea out between 7.6 and 9.6 units so it keeps a soft oval edge;
  // the full-screen explorer shows opaque sea to every edge.
  const edge = fade.createRadialGradient(128, 128, 0, 128, 128, 128);
  edge.addColorStop(0, '#fff');
  edge.addColorStop(7.6 / half, '#fff');
  edge.addColorStop(9.6 / half, '#000');
  fade.fillStyle = edge;
  fade.fillRect(0, 0, 256, 256);
  const map = new CanvasTexture(paintCanvas);
  map.colorSpace = SRGBColorSpace;
  const alphaMap = new CanvasTexture(fadeCanvas);
  const surface = new MeshBasicMaterial({
    map,
    alphaMap,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const sea = new Mesh(new PlaneGeometry(size, size), surface);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.36;
  sea.renderOrder = -1;
  const foamShape = new Shape(
    coast.getPoints().map((point) => point.clone().multiplyScalar(1.05)),
  );
  foamShape.holes.push(
    new Shape(coast.getPoints().map((point) => point.clone())),
  );
  const foamGeometry = new ExtrudeGeometry(foamShape, {
    depth: 0.001,
    bevelEnabled: false,
  });
  foamGeometry.rotateX(-Math.PI / 2);
  const foam = new Mesh(
    foamGeometry,
    new MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  foam.position.y = -0.35;
  return {
    meshes: [sea, foam],
    paint(dusk: boolean) {
      const { shallow, deep } = dusk ? seaColours.dusk : seaColours.day;
      const depth = paint.createRadialGradient(256, 256, 0, 256, 256, 256);
      depth.addColorStop(0, shallow);
      depth.addColorStop(7.8 / half, shallow);
      depth.addColorStop(10 / half, deep);
      depth.addColorStop(1, deep);
      paint.fillStyle = depth;
      paint.fillRect(0, 0, 512, 512);
      map.needsUpdate = true;
      foam.material.opacity = dusk ? 0.18 : 0.4;
    },
    setOpen(open: boolean) {
      surface.alphaMap = open ? null : alphaMap;
      surface.needsUpdate = true;
    },
  };
}
