import "./chai";
import "./zomes";

const expect = chai.expect;

/**
 * Web API tests
 * Agents
 */

export class Person {
  agent: CrudResponse<agents.Agent>;
  apples: CrudResponse<resources.EconomicResource>;
  beans: CrudResponse<resources.EconomicResource>;
  coffee: CrudResponse<resources.EconomicResource>;
  turnovers: CrudResponse<resources.EconomicResource>;
}
export interface Verbs {

  pickApples(
    howMany: number,
    when?: IntDate,
    inventory?: Hash<resources.EconomicResource>
  ): Promise<CrudResponse<events.EconomicEvent>>;

  gatherBeans(
    howMany: number,
    when?: IntDate,
    inventory?: Hash<resources.EconomicResource>
  ): Promise<CrudResponse<events.EconomicEvent>>;

  brewCoffee(
    howMuch: number,
    when?: IntDate,
    useBeans?: Hash<resources.EconomicResource>,
    inventory?: Hash<resources.EconomicResource>
  ): Promise<CrudResponse<events.Process>>;

  bakeTurnovers(
    howMany: number,
    when?: IntDate,
    useApples?: Hash<resources.EconomicResource>,
    inventory?: Hash<resources.EconomicResource>
  ): Promise<CrudResponse<events.Process>>;

  trade(
    howMuch: QuantityValue,
    from: Hash<resources.EconomicResource>,
    to: Hash<resources.EconomicResource>,
    when?: IntDate
  ): Promise<CrudResponse<events.Transfer>>

  inventory(who: Person): Promise<Inventory<QuantityValue>>;
}

export interface Scenario {

  al: Person,
  bea: Person,
  chloe: Person,
  david: Person,

  types: {
    resource: { [name:string]: CrudResponse<resources.ResourceClassification> },
    process: { [name:string]: CrudResponse<events.ProcessClassification> },
    transfer: { [name:string]: CrudResponse<events.TransferClassification> }
  },

  actions: { [name:string]: CrudResponse<events.Action> },
  /*
  events: { [name:string]: CrudResponse<events.EconomicEvent> },
  transfers: { [name:string]: CrudResponse<events.Transfer> },
  processes: { [name:string]: CrudResponse<events.Process> },
  */
  verbs: Verbs,
  facts: { [name:string]: number },
  timeline: { [name:string]: number }
}

function scenario(): Scenario {
  return {
    al: new Person(),
    bea: new Person(),
    chloe: new Person(),
    david: new Person(),
    types: {
      resource: {},
      transfer: {},
      process: {}
    },
    actions: {},
    //events: {},
    facts: {},
    verbs: null,
    //transfers: {},
    //processes: {},
    timeline: {}
  };
}

interface Inventory<T extends string|number|QuantityValue> {
  apples?: T;
  beans?: T;
  coffee?: T;
  turnovers?: T;
}

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

export function verbify(my: Scenario) {
  let [al, bea, chloe] = [my.al, my.bea, my.chloe].map((person) => person.agent);
  let {facts, types, actions} = my;
  let {pick, gather, produce, consume} = actions;
  let trade = types.transfer.trade;
  let {brew, bake} = types.process;

  async function pickApples(
    howMany: number,
    when: number = 0,
    resource: Hash<resources.EconomicResource> = my.al.apples.hash
  ): Promise<CrudResponse<events.EconomicEvent>> {
    when = when || await tick();

    return events.createEvent({
      action: pick.hash,
      provider: al.hash,
      receiver: al.hash,
      start: when,
      duration: howMany*1000*facts.secondsPerHour/facts.applesPerHour,
      affects: resource,
      affectedQuantity: { units: ``, quantity: howMany }
    });
  }


  async function gatherBeans(
    howMuch: number,
    when: number = 0,
    resource: Hash<resources.EconomicResource> = my.bea.beans.hash
  ): Promise<CrudResponse<events.EconomicEvent>> {
    when = when || await tick();

    return events.createEvent({
      action: gather.hash,
      provider: bea.hash,
      receiver: bea.hash,
      start: when,
      duration: howMuch*1000*facts.secondsPerHour/facts.beansPerHour,
      affects: resource,
      affectedQuantity: { units: `kg`, quantity: howMuch }
    });
  }

  async function transfer(
    howMuch: QuantityValue,
    fromHash: Hash<resources.EconomicResource>,
    toHash: Hash<resources.EconomicResource>,
    when?: IntDate
  ): Promise<CrudResponse<events.Transfer>> {
    when = when || await tick();

    let [from, to] = await resources.readResources([fromHash, toHash]);

    return events.createTransfer({
      transferClassifiedAs: trade.hash,
      inputs: {
        action: my.actions.give.hash,
        provider: from.entry.owner,
        receiver: to.entry.owner,
        affects: from.hash,
        start: when,
        duration: 1,
        affectedQuantity: howMuch
      },
      outputs: {
        action: my.actions.take.hash,
        provider: from.entry.owner,
        receiver: to.entry.owner,
        affects: to.hash,
        start: when,
        duration: 1,
        affectedQuantity: howMuch
      }
    });
  }

  async function brewCoffee(
    cups: number,
    when: number = 0,
    beanRes: Hash<resources.EconomicResource> = my.chloe.beans.hash,
    coffeeRes: Hash<resources.EconomicResource> = my.chloe.coffee.hash
  ): Promise<CrudResponse<events.Process>> {
    when = when || await tick();

    let beansNeeded = facts.spoonsPerCup*facts.gramsPerSpoon*cups/1000;
    let beansHad =
      (await resources.readResources([beanRes]))[0]
      .entry.currentQuantity.quantity;

    if (beansHad < beansNeeded) {
      return Promise.reject(
        `can't make ${cups} cups of coffee with only ${beansHad} kg of coffee beans`
      );
    }

    let [consumeEv, brewEv] = await Promise.all([
      events.createEvent({
        action: consume.hash,
        provider: chloe.hash,
        receiver: chloe.hash,
        start: when,
        duration: 1,
        affects: beanRes,
        affectedQuantity: { units: `kg`, quantity: beansNeeded }
      }),
      events.createEvent({
        action: produce.hash,
        provider: chloe.hash,
        receiver: chloe.hash,
        start: when,
        duration: 1000*cups*facts.mlPerCup*facts.secondsPerHour/facts.coffeePerHour,
        affects: coffeeRes,
        affectedQuantity: { units: `mL`, quantity: cups*facts.mlPerCup }
      })
    ]);

    return events.createProcess({
      processClassifiedAs: brew.hash,
      inputs: [consumeEv.hash],
      outputs: [brewEv.hash],
      plannedStart: when,
      plannedDuration: 1000*cups*facts.mlPerCup*facts.secondsPerHour/facts.coffeePerHour,
      isFinished: true
    })

  }

  async function bakeTurnovers(
    howMany: number,
    when?: IntDate,
    appleRes: Hash<resources.EconomicResource> = my.chloe.apples.hash,
    turnoverRes: Hash<resources.EconomicResource> = my.chloe.turnovers.hash
  ): Promise<CrudResponse<events.Process>> {
    when = when || await tick();

    let usedApples = howMany*facts.applesPerTurnover;

    let [currentApples] = await resources.readResources([appleRes]);
    if (!currentApples || !currentApples.entry || currentApples.error || currentApples.entry.currentQuantity.quantity < usedApples) {
      throw new Error(`can't make ${howMany} turnovers with ${currentApples.entry.currentQuantity.quantity}/${usedApples} apples`);
    }

    let [consumeEv, produceEv] = await Promise.all([
      events.createEvent({
        action: my.actions.consume.hash,
        provider: chloe.hash,
        receiver: chloe.hash,
        affects: appleRes,
        start: when,
        duration: facts.bakeTime*1000,
        affectedQuantity: { units: ``, quantity: usedApples }
      }),
      events.createEvent({
        action: my.actions.produce.hash,
        provider: chloe.hash,
        receiver: chloe.hash,
        affects: turnoverRes,
        start: when,
        duration: facts.bakeTime*1000,
        affectedQuantity: { units: ``, quantity: howMany }
      })
    ]);

    return events.createProcess({
      processClassifiedAs: bake.hash,
      plannedStart: when,
      plannedDuration: facts.bakeTime,
      inputs: [consumeEv.hash],
      outputs: [produceEv.hash],
      isFinished: true
    });
  }

  async function inventory(who: Person): Promise<Inventory<QuantityValue>> {
    let {apples, beans, coffee, turnovers} = who;

    [apples, beans, coffee, turnovers] = await resources.readResources(
      [apples, beans, coffee, turnovers].map((r) => r.hash)
    );

    let res: Inventory<QuantityValue> = {};
    let [qa, qb, qc, qt] = [apples, beans, coffee, turnovers].map((r) => {
      let q = r.entry.currentQuantity;
      return q;
    });

    if (qa) res.apples = qa;
    if (qb) res.beans = qb;
    if (qc) res.coffee = qc;
    if (qt) res.turnovers = qt;

    return res;
  }

  my.verbs = {
    pickApples, gatherBeans, trade: transfer, bakeTurnovers, brewCoffee,
    inventory
  };

  return my;
}

function checkAllInventory(
  invs: Partial<{
    [name in "al"|"bea"|"chloe"]: Inventory<number>
  }>
): (sc: Scenario) => Promise<Scenario> {

  async function checkInv(person: Person, inv: Inventory<number>) {
    for (let resName of Object.keys(inv)) {
      let resHash: Hash<resources.EconomicResource> = person[resName].hash;
      let [res] = await resources.readResources([resHash]);
      expectGoodCrud(res, `EconomicResource`, `inventory crud: ${person.agent.entry.name} ${resName}`);
      expect(res.entry.currentQuantity, `inventory quantity: ${person.agent.entry.name} ${resName}`)
        .to.have.property(`quantity`, inv[resName]);
    }
  }

  return (sc) => Promise.all(Object.keys(invs).map(
    (name) => checkInv(sc[name], invs[name])
  )).then(() => sc);
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

export async function ready(): Promise<Scenario> {

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
      my.al.agent = al;
      return my;
    }).then((my) => Promise.all([
        agents.createAgent({name: `Bea`}).then((bea) => {
          my.bea.agent = bea;
          return my;
        }),
        agents.createAgent({name: `Chloe`}).then((chloe) => {
          my.chloe.agent = chloe;
          return my;
        })
      ]).then(() => my)
    ).then(async (my) => {
      // TEST agents.readAgents
      let {al, bea, chloe} = my;
      let people = {
        al: al.agent,
        bea: bea.agent,
        chloe: chloe.agent
      };
      let keys = Object.keys(people);
      let hashes = keys.map(key => people[key].hash);
      const them = await agents.readAgents(hashes);

      let expectData = expect(them, `readAgents results`);
      const hashMap = them.reduce((dict, resp, i) => {
          dict[resp.hash] = i;
          return dict;
      }, {});

      expectData.to.be.instanceOf(Array);
      for (let person of Object.keys(people)) {
          let hash = people[person].hash;
          expect(them[hashMap[hash]], `entry for agent ${person}`)
              .to.deep.equal(people[person], `previous agent data`);
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
      my.types.resource = {apples, beans, turnovers, coffee};
      return my;
    })
  }

  // TEST resources.getResourcesInClass *returning none
  prep = prep.then(async (my) => {
    let emptyRes = await resources.getResourcesInClass({
      classification: my.types.resource.apples.hash
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
    let pc = evFix.ProcessClassification;

    events.getFixtures({}).then((fix) => {
      expect(fix, `The second read of the event fixtures`)
        .to.deep.equal(evFix);
    });

    // TEST events.readTransferClasses & readProcessClasses
    let p = Promise.all([

      events.readTransferClasses([tc.stub]).then(([stub]) => {
        expect(stub.entry, `The stub transfer class`).to.have.property(`name`)
          .that.is.a(`string`);
        my.types.transfer.stub = stub;
      }),

      events.readProcessClasses([pc.stub]).then(([stub]) => {
        expectGoodCrud(stub, `ProcessClassification`, `The process class stub crud`);
        expect(stub.entry, `The stub process class`).to.have.property(`name`)
          .that.is.a(`string`);
        my.types.process.stub = stub;
      })
    ]);

    // TEST events.readActions
    let [give, take, adjust, produce, consume] = await events.readActions([
      act.give, act.receive, act.adjust, act.produce, act.consume
    ]);
    my.actions = {give, take, adjust, produce, consume};

    expect(take, `action fixture take`).to.have.property(`behavior`, '+');
    expect(give, `action fixture give`).to.have.property(`behavior`, '-');
    expect(adjust, `action fixture adjust`).to.have.property(`behavior`, '+');

    // TEST events.createAction
    let [pick, gather] = await Promise.all([
      events.createAction({name: `pick`, behavior: '+'}).then((pick) => {
        expectGoodCrud(pick, `Action`, `Action pick crud`);

        let expectPick = expect(pick.entry, `Action pick`);
        expectPick.to.have.property(`name`, `pick`);
        expectPick.to.have.property(`behavior`, '+');
        return pick;
      }),
      events.createAction({name: `gather`, behavior: '+'})
    ]);

    Object.assign(my.actions, {pick, gather});

    // TEST events.readActions
    ([consume] = await events.readActions([consume.hash]));

    expectGoodCrud(consume);
    expect(consume.entry, `read-back action consume`).to.have.property(`behavior`, '-');

    // TEST events.createTransferClass
    let trade = my.types.transfer.trade = await events.createTransferClass({name: `trade`});
    expectGoodCrud(trade, `TransferClassification`, `crud from creation of trade transfer type`);
    expect(trade.entry, `Transfer class trade`)
      .to.have.property(`name`)
        .a(`string`)
        .that.equals(`trade`);

    // TEST events.createProcessClass
    let [bake, brew] = await Promise.all([
      events.createProcessClass({name: `bake`, label: `bake`}).then((bake) => {
        expectGoodCrud(bake, `ProcessClassification`, `Bake process class`);
        expect(bake.entry).to.have.property(`name`, `bake`);
        expect(bake.entry).to.have.property(`label`, `bake`);

        return bake;
      }),
      events.createProcessClass({name: `brew`, label: `brew`})
    ]);

    {
      let pcs = new Set<Hash<events.ProcessClassification>>([bake.hash, brew.hash, pc.stub]);
      expect(pcs.size === 3, `all PC hashes should be unique`).to.be.true;
    }

    my.types.process = Object.assign(my.types.process, {bake, brew});

    return p.then(() => my);
  });



  // Time to start making events and resources
  prep = prep.then(async (my) => {

    let david = await agents.createAgent({
      name: `David`,
      primaryLocation: [`412 kongstun st`, `hullodeysbarg, QB 27759`]
    });

    let time = await tick();
    my.timeline.begin = time;

    let al = my.al.agent,
      bea = my.bea.agent,
      chloe = my.chloe.agent;
    let { apples, beans, turnovers, coffee } = my.types.resource,
      { pick, gather, give, take, adjust, produce, consume } = my.actions,
      { bake, brew } = my.types.process,
      { trade } = my.types.transfer;

    async function setupInventory(person: Person) {
      let name = person.agent.entry.name,
        hash = person.agent.hash,
        when = await tick();
      if (!person.apples) {
        person.apples = await resources.createResource({
          resource: {
            resourceClassifiedAs: apples.hash,
            owner: hash,
            currentQuantity: { units: '', quantity: 0 },
            trackingIdentifier: `${name}:apples`
          },
          event: {
            action: adjust.hash,
            provider: hash,
            receiver: hash,
            start: when,
            duration: 1
          }
        });
      }

      person.beans = person.beans || await events.resourceCreationEvent({
        resource: {
          resourceClassifiedAs: beans.hash,
          owner: hash,
          currentQuantity: { units: `kg`, quantity: 0 },
          trackingIdentifier: `${name}:beans`
        },
        dates: { start: when }
      })
      .then((ev) => resources.readResources([ev.entry.affects]))
      .then(([res]) => res);

      person.coffee = person.coffee || await events.resourceCreationEvent({
        resource: {
          resourceClassifiedAs: coffee.hash,
          owner: hash,
          currentQuantity: { units: `mL`, quantity: 0 },
          trackingIdentifier: `${name}:coffee`
        },
        dates: { start: when }
      })
      .then((ev) => resources.readResources([ev.entry.affects]))
      .then(([res]) => res);

      person.turnovers = person.turnovers || await events.resourceCreationEvent({
        resource: {
          resourceClassifiedAs: turnovers.hash,
          owner: hash,
          currentQuantity: { units: ``, quantity: 0 },
          trackingIdentifier: `${name}:turnovers`
        },
        dates: { start: when }
      })
      .then((ev) => resources.readResources([ev.entry.affects]))
      .then(([res]) => res);
    }

    let [
      alApples, beaBeans, chloeCoffee
    ] = await Promise.all([
      resources.createResource({
        resource: {
          resourceClassifiedAs: apples.hash,
          owner: al.hash,
          currentQuantity: { units: '', quantity: 100 },
          trackingIdentifier: `Al's apples`
        },
        event: {
          action: pick.hash,
          provider: al.hash,
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

        return my.al.apples = alApples;
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
          provider: bea.hash,
          receiver: bea.hash,
          start: await tick(),
          duration: 1
        }
      }).then((bb) => (my.bea.beans = bb)),

      // TEST events.resourceCreationEvent
      events.resourceCreationEvent({
        resource: {
          currentQuantity: { units: `mL`, quantity: 300 },
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
          .that.deep.equals({ units: `mL`, quantity: 300 }, `300 mL`);
        expectIt.to.have.property(`resourceClassifiedAs`, coffee.hash, `coffee`);
        expectIt.to.have.property(`owner`, chloe.hash, `Chloe`);

        return my.chloe.coffee = res;
      })
    ]);

    await Promise.all([my.al, my.bea, my.chloe].map(person => setupInventory(person)));

    my.facts = (() => {
      let gramsPerSpoon: number = 2.5;
      let spoonsPerCup: number = 1;
      let mlPerCup: number = 236.588;
      let applesPerTurnover: number = 3;
      let secondsPerHour: number = 3600;
      // not sure where this ranks him, but Al can pick an apple every 5 seconds.
      let applesPerHour: number = (1/5)*secondsPerHour;
      let kgPerLb: number = 0.453592;
      // Bea is a "good picker" by NCAUSA.org standards.
      let beansPerHour: number = 30*kgPerLb/8;
      let coffeePerHour: number = (12/10)*mlPerCup*60;
      let bakeTime: number = 25*60;

      return {
        gramsPerSpoon, spoonsPerCup, mlPerCup, applesPerTurnover,
        secondsPerHour, applesPerHour, kgPerLb, beansPerHour,
        coffeePerHour, bakeTime
      };
    })();

    let facts = my.facts;

    // before packing things up into functions to consume, do a complete scenario run
    // [x] al has apples
    // [x] bea has beans
    // [x] chloe has some initial coffee
    // [x] everyone has a complete inventory with 0 quantities where appropriate
    // [ ] al trades apples for coffee
    return verbify(my);
  }).then(async (my) => {
    // TODO: This is kind of a secondary function, consider moving it out of sequence
    // namespace freshening
    let {al, bea, chloe} = my;
    let {apples, turnovers} = my.types.resource;

    // TEST agents.getOwnedResources
    let invs = await agents.getOwnedResources({
      agents: [al.agent.hash, bea.agent.hash, chloe.agent.hash],
      types: [apples.hash, turnovers.hash]
    });

    for (let agent of [al, bea, chloe]) {
      let inventory = invs[agent.agent.hash];
      let turnoverRes = inventory[turnovers.hash];
      await resources.readResources([turnoverRes]).then(([crud]) => {
        expectGoodCrud(crud, `EconomicResource`, `turnover res crud`);
        expect(crud.entry.currentQuantity.quantity, `turnovers in inventory`)
          .to.equal(0);
      });
    }

    let [alApples] = await resources.readResources([invs[al.agent.hash][apples.hash]]);
    expect(alApples.entry.currentQuantity.quantity, `al's quantity of apples`)
      .to.equal(100);

    return my;
  }).then(async (my) => {
    // namespace freshening
    // Al arrives with 3 apples. He gives them to Chloe, Chloe receives them.
    let {al, chloe} = my;
    let trade = my.types.transfer.trade;
    let {give, take} = my.actions;
    const AL_ARRIVES = await tick();

    let [giveEv, takeEv] = await Promise.all([
      events.createEvent({
        action: give.hash,
        provider: al.agent.hash,
        receiver: chloe.agent.hash,
        affects: al.apples.hash,
        start: AL_ARRIVES,
        duration: 1,
        affectedQuantity: { units: ``, quantity: 3 }
      }),
      events.createEvent({
        action: take.hash,
        provider: al.agent.hash,
        receiver: chloe.agent.hash,
        affects: chloe.apples.hash,
        start: AL_ARRIVES,
        duration: 1,
        affectedQuantity: { units: ``, quantity: 3 }
      })
    ]);

    // TEST createEvent affects resource
    let [src, dest] = await resources.readResources([al.apples.hash, chloe.apples.hash]).then(([src, dest]) => {
      expectGoodCrud(src, `EconomicResource`, `Al's apples crud after first give`);
      expectGoodCrud(dest, `EconomicResource`, `Chloe's apples crud after first give`);

      expect(src.entry, `Al's apples after exchange`)
        .to.have.property(`currentQuantity`)
        .that.is.an(`object`)
        .that.does.exist
        .that.has.property(`quantity`)
          .that.is.a(`number`)
          .that.equals(97);

      expect(dest.entry, `Chloe's apples after first trade`)
        .to.have.property(`currentQuantity`)
        .that.is.an(`object`)
        .that.does.exist
        .that.has.property(`quantity`)
          .that.is.a(`number`)
          .that.equals(3);

      return [src, dest];
    });

    // TEST events.createTransfer(Transfer)
    let p1 = events.createTransfer({
      transferClassifiedAs: trade.hash,
      inputs: giveEv.hash,
      outputs: takeEv.hash
    }).then(async (xfer) => {
      expectGoodCrud(xfer, `Transfer`, `First exchange crud`);

      // Can't expect the events to have the same hashes; instead make sure they target
      // the same other instances.
      let [inputs, outputs] = await events.readEvents([xfer.entry.inputs, xfer.entry.outputs]);
      expectGoodCrud(inputs, `EconomicEvent`);
      expectGoodCrud(outputs, `EconomicEvent`);

      expect(inputs.entry, `inputs`).to.have.property(`provider`, al.agent.hash);
      expect(inputs.entry, `inputs`).to.have.property(`receiver`, chloe.agent.hash);
      expect(inputs.entry, `inputs`).to.have.property(`affects`, src.hash);

      expect(outputs.entry, `outputs`).to.have.property(`provider`, al.agent.hash);
      expect(outputs.entry, `outputs`).to.have.property(`receiver`, chloe.agent.hash);
      expect(outputs.entry, `outputs`).to.have.property(`affects`, dest.hash);

      return xfer;
    });

    // Chloe gives Al a 300 mL cup of coffee. Al receives it.

    // TEST events.createTransfer(Transfer(event, event))
    let p2 = events.createTransfer({
      transferClassifiedAs: my.types.transfer.trade.hash,
      inputs: {
        action: my.actions.give.hash,
        provider: chloe.agent.hash,
        receiver: al.agent.hash,
        affects: chloe.coffee.hash,
        affectedQuantity: { units: `mL`, quantity: 300 },
        start: AL_ARRIVES + 100,
        duration: 1
      },
      outputs: {
        action: my.actions.take.hash,
        provider: chloe.agent.hash,
        receiver: al.agent.hash,
        affects: al.coffee.hash,
        affectedQuantity: { units: `mL`, quantity: 300 },
        start: AL_ARRIVES + 100,
        duration: 1
      }
    }).then(async (xfer) => {
      expectGoodCrud(xfer, `Transfer`, `crud from transfer chloe coffee => al coffee`);

      let [inputs, outputs] = await events.readEvents([xfer.entry.inputs, xfer.entry.outputs]);
      expectGoodCrud(inputs, `EconomicEvent`, `chloe give coffee to al crud`);
      expectGoodCrud(outputs, `EconomicEvent`, `al take coffee from chloe crud`);

      expect(inputs.entry, `chloe give coffee to all`).to.deep.equal({
        action: my.actions.give.hash,
        provider: chloe.agent.hash,
        receiver: al.agent.hash
      });

      expect(outputs.entry, `al take coffee from chloe`).to.deep.equal({
        action: my.actions.take.hash,
        provider: chloe.agent.hash,
        receiver: al.agent.hash
      });

      return xfer;
    });

    return Promise.all([p1, p2]).then(() => my);
  }).then(checkAllInventory({
    al: { apples: 97, coffee: 300 },
    bea: { beans: 2 },
    chloe: { apples: 3, coffee: 0 }
  })).then(async (my) => {
    let {chloe} = my;
    // Chloe consumes 3 apples to bake 1 turnover
    let time = my.timeline.firstBake = await tick();

    // TEST events.createProcess
    let [inputs, outputs] = await Promise.all([
      events.createEvent({
        action: my.actions.consume.hash,
        provider: chloe.agent.hash,
        receiver: chloe.agent.hash,
        affects: chloe.apples.hash,
        affectedQuantity: { units: ``, quantity: 3 },
        start: time,
        duration: my.facts.bakeTime
      }),
      events.createEvent({
        action: my.actions.produce.hash,
        provider: chloe.agent.hash,
        receiver: chloe.agent.hash,
        affects: chloe.turnovers.hash,
        affectedQuantity: { units: ``, quantity: 1 },
        start: time,
        duration: my.facts.bakeTime
      })
    ]);

    let ihash = inputs.hash;
    let ohash = outputs.hash;

    let proc = await events.createProcess({
      processClassifiedAs: my.types.process.bake.hash,
      inputs: [ihash],
      outputs: [ohash],
      plannedStart: time,
      plannedDuration: my.facts.bakeTime,
      isFinished: true
    });
    expectGoodCrud(proc, `Process`, `chloe's first bake process crud`);

    [inputs, outputs] = await events.readEvents([ihash, ohash]);

    expect(inputs.entry).to.have.property(`inputOf`, proc.hash);
    expect(outputs.entry).to.have.property(`outputOf`, proc.hash);

    return my;
  }).then(checkAllInventory({
    chloe: { apples: 0, turnovers: 1 }
  })).then(async (my) => {
    let {chloe, bea} = my;

    await my.verbs.trade(
      { units: ``, quantity: 1 },
      chloe.turnovers.hash,
      bea.turnovers.hash,
      await tick()
    );

    await my.verbs.trade(
      { units: `kg`, quantity: 0.5 },
      bea.beans.hash,
      chloe.coffee.hash,
      await tick()
    );

    await my.verbs.brewCoffee(1000, await tick());
    return my;
  });

  return prep;
}
/*
export var ready: () => Promise<Scenario> = () => prep;
/**/

// Come back to:
//  resources.getResourcesInClass
//  resources.getFixtures?
// Come back to: agents.getOwnedResources
