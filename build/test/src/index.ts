import "./chai";
import "./zomes";

const expect = chai.expect;

/**
 * Web API tests
 * Agents
 */

interface Scenario {
  agents: { [name:string]: CrudResponse<agents.Agent> },
  stuff: { [name:string]: CrudResponse<resources.EconomicResource> },
  types: { [name:string]: CrudResponse<resources.ResourceClassification> },
  actions: { [name:string]: CrudResponse<events.Action> },
  events: { [name:string]: CrudResponse<events.EconomicEvent> }
}

function scenario(): Scenario {
  return {
    agents: {},
    stuff: {},
    types: {},
    actions: {},
    events: {}
  };
}

function expectGoodCrud<T>(
  crud: CrudResponse<T>, type?: string, name?: string
): CrudResponse<T> {
  name = name || undefined;
  expect(crud, name).to.have.property(`error`).that.does.not.exist;

  if (type) {
    expect(crud.type, `type of ${name}`).to.be.a(`string`).equals(type);
  }

  expect(crud, name).to.have.property(`hash`)
    .a(`string`)
    .that.does.exist
    .that.has.length.gt(1);

  expect(crud, name).to.have.property(`entry`)
    .an(`object`)
    .that.does.exist;

  return crud;
}

let prep: Promise<Scenario>;

{
  prep = agents.createAgent({
    name: `Al`,
    note: `a note`,
    primaryLocation: [`1 roady street`, `placeville, XX 12345`]
  }).then((al) => {
    // TEST agents.createAgent
    expectGoodCrud(al, `Agent`, `Al`);

    let expectData = expect(al.entry, `Al`);
    expectData.to.have.property(`name`, `Al`);
    expectData.to.have.property(`note`, `a note`);
    expectData.to.have.property(`primaryLocation`)
      .that.deep.eq([`1 roady street`, `placeville, XX 12345`]);

    let my = scenario();
    my.agents.al = al;
    return my;
  }).then((my) => Promise.all([
      agents.createAgent({name: `Bea`}).then((bea) => {
        my.agents.bea = bea;
        return my;
      }),
      agents.createAgent({name: `Chloe`}).then((chloe) => {
        my.agents.chloe = chloe;
        return my;
      })
    ]).then(() => my)
  ).then(async (my) => {
    // TEST agents.readAgents
    let keys = Object.keys(my.agents);
    let hashes = keys.map(key => my.agents[key].hash);
    const them = await agents.readAgents(hashes);

    let expectData = expect(them, `readAgents results`);
    const hashMap = them.reduce((dict, resp, i) => {
        dict[resp.hash] = i;
        return dict;
    }, {});

    expectData.to.be.instanceOf(Array);
    for (let person of Object.keys(my.agents)) {
        let hash = my.agents[person].hash;
        expect(them[hashMap[hash]], `entry for agent ${person}`)
            .to.deep.equal(my.agents[person], `previous agent data`);
    }
    return my;
  })
}

{
  prep = Promise.all([
    prep,
    // TEST resources.createResourceClassification
    resources.createResourceClassification({
      name: `apples`,
      defaultUnits: ``
    }).then((apples) => {

      expectGoodCrud(apples, `ResourceClassification`, `resource class apples crud`);

      let expectData = expect(apples.entry, `apples resource class`);
      expectData.to.have.property(`name`).that.equals(`apples`);
      expectData.to.have.property(`defaultUnits`).that.equals(``);

      return apples
    }),

    resources.createResourceClassification({
      name: `coffee beans`,
      defaultUnits: `kg`
    }).then(async (beans) => {
      // TEST resources.readResourceClasses
      let hash = beans.hash;
      let [readBeans] = await resources.readResourceClasses([hash]);

      expect(readBeans, `The read beans resource class`)
        .to.deep.equal(beans);

      return beans;
    }),

    resources.createResourceClassification({
      name: `apple turnovers`,
      defaultUnits: ``
    }),

    resources.createResourceClassification({
      name: `coffee`,
      defaultUnits: `mL`
    })
  ]).then(([my, apples, beans, turnovers, coffee]) => {
    my.types = {apples, beans, turnovers, coffee};
    return my;
  })
}

// TEST resources.getResourcesInClass *returning none
prep = prep.then(async (my) => {
  let emptyRes = await resources.getResourcesInClass({
    classification: my.types.apples.hash
  });

  let expectRes = expect(
    emptyRes, `resources of class apples before they exist`
  );

  expectRes.to.be.an(`object`)
    .instanceOf(Array)
    .that.is.empty;

  return my;
});

let stub: CrudResponse<events.TransferClassification>;
prep = prep.then(async (my) => {
  // TEST events.getFixtures
  let evFix = await events.getFixtures(null);

  let tc = evFix.TransferClassification;
  let act = evFix.Action;

  // TEST events.readTransferClasses
  let pStub = events.readTransferClasses([tc.Stub]).then(([stub]) => {
    expect(stub.entry, `The stub transfer class`).to.have.property(`name`)
      .that.is.a(`string`);
    return stub;
  });

  // TEST events.readActions
  let [give, take, adjust] = await events.readActions([
    act.Give, act.Receive, act.Adjust
  ]);
  my.actions = {give, take, adjust};

  expect(take, `action fixture take`).to.have.property(`behavior`, '+');
  expect(give, `action fixture give`).to.have.property(`behavior`, '-');
  expect(adjust, `action fixture adjust`).to.have.property(`behavior`, '+');

  // TEST events.createAction
  let [bake, brew, pick, gather, consume] = await Promise.all([
    events.createAction({name: `bake`, behavior: `+`}).then((bake) => {
      expectGoodCrud(bake, `Action`, `action bake crud`)

      let expectBake = expect(bake.entry, `action bake`);
      expectBake.to.have.property(`name`, `bake`);
      expectBake.to.have.property(`behavior`, '+');
      return bake;
    }),

    events.createAction({name: `brew`, behavior: '+'}),
    events.createAction({name: `pick`, behavior: '+'}),
    events.createAction({name: `gather`, behavior: '+'}),
    events.createAction({name: `consume`, behavior: '-'})
  ]);

  Object.assign(my.actions, {bake, brew, pick, gather, consume});

  [bake, consume] = await events.readActions([bake.hash, consume.hash]);

  expectGoodCrud(bake);
  expectGoodCrud(consume);

  let expectBake = expect(bake.entry, `read-back action bake`);
  let expectConsume = expect(consume.entry, `read-back action consume`);

  expectBake.to.have.property(`behavior`, '+');

  expectConsume.to.have.property(`behavior`, '-');

  stub = await pStub;
  return my;
});

async function ms(n: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, n);
  });
}

async function tick(): Promise<number> {
  const now = Date.now();
  if (now === tick.last) {
    return ms(1).then(tick);
  } else {
    tick.last = now;
    return now;
  }
}
namespace tick {
  export var last = Date.now();
}

// Time to start making events and resources
prep = prep.then(async (my) => {

  let david = await agents.createAgent({
    name: `David`,
    primaryLocation: [`412 kongstun st`, `hullodeysbarg, QB 27759`]
  });

  let time = await tick();

  let {al, bea, chloe} = my.agents,
    {apples, beans, turnovers, coffee} = my.types,
    {pick, bake, gather, brew, give, take, adjust} = my.actions;

  let [alApples, beaBeans] = await Promise.all([
    resources.createResource({
      resource: {
        resourceClassifiedAs: apples.hash,
        owner: al.hash,
        currentQuantity: { units: '', quantity: 100 },
        trackingIdentifier: `Al's apples`
      },
      event: {
        action: pick.hash,
        provider: david.hash,
        receiver: al.hash,
        start: time,
        duration: 1
      }
    }).then(async (alApples) => {
      // TEST resources.createResource (events.createEvent, resources.affect)
      expectGoodCrud(alApples);

      let expectEm = expect(alApples.entry, `Al's apples`)

      expectEm.to.have.property(`owner`).that.equals(al.hash);
      expectEm.to.have.property(`currentQuantity`).an(`object`)
        .that.does.exist
        .that.deep.equals({quantity: 100, units: ''}, `x100`);
      expectEm.to.have.property(
        `resourceClassifiedAs`, undefined, `classification`
      ).a(`string`).that.equals(apples.hash, `apples`);

      // TEST resources.getAffectingEvents
      let pickings = await resources.getAffectingEvents(
        {resource: alApples.hash}
      );
      expect(pickings).to.be.an(`object`).instanceOf(Array).that.has.length(1);

      // TEST events.readEvents
      let [picking] = await events.readEvents(pickings)
      expectGoodCrud(picking);

      let expectIt = expect(picking.entry, `the first apple picking event`);
      expectIt.to.have.property(`action`)
        .that.is.a(`string`).that.equals(pick.hash, `pick`);
      expectIt.to.have.property(`receiver`).that.equals(al.hash, `Al`);
      expectIt.to.have.property(`start`).that.equals(time);
      expectIt.to.have.property(`duration`).that.equals(1);
      expectIt.to.have.property(`affectedQuantity`).an(`object`)
        .that.deep.equals({units: ``, quantity: 100});

      return alApples;
    }),

    resources.createResource({
      resource: {
        resourceClassifiedAs: beans.hash,
        owner: bea.hash,
        currentQuantity: { units: 'kg', quantity: 2 },
        trackingIdentifier: `Bea's Beans`
      },
      event: {
        action: gather.hash,
        provider: david.hash,
        receiver: bea.hash,
        start: await tick(),
        duration: 1
      }
    }),

    // TEST events.resourceCreationEvent
    events.resourceCreationEvent({
      resource: {
        currentQuantity: { units: `mL`, quantity: 300},
        resourceClassifiedAs: coffee.hash,
        trackingIdentifier: `Chloe's coffee`,
        owner: chloe.hash
      },
      dates: {
        start: await tick()
      }
    }).then(async (adjustEv) => {
      expectGoodCrud(adjustEv, `Event`, `crud of adjust event for Chloe's coffee`);
      let expectIt = expect(
        adjustEv.entry, `The adjust event for Chloe's coffee`
      );

      expectIt.to.have.property(`affects`).that.is.a(`string`)
        .that.has.length.gt(1);

      expectIt.to.have.property(`affectedQuantity`).that.is.an(`object`)
        .that.does.exist
        .that.deep.equals({ units: `mL`, quantity: `300` });

      // TEST resources.readResources
      let [res] = await resources.readResources([adjustEv.entry.affects]);
      expectGoodCrud(res);

      expectIt = expect(res.entry, `Chloe's coffee resource`);
      expectIt.to.have.property(`currentQuantity`).an(`object`)
        .that.does.exist
        .that.deep.equals({ units: `mL`, quantity: 300}, `300 mL`);
      expectIt.to.have.property(`resourceClassifiedAs`, coffee.hash, `coffee`);
      expectIt.to.have.property(`owner`, chloe.hash, `Chloe`);

      return res;
    })
  ])


  return my;
})

// Come back to: resources.createResource
//  resources.getResourcesInClass
//  resources.getFixtures?
// Come back to: agents.getOwnedResources
