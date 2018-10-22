/**
 * Test the elements of common: QuantityValue, HoloObject, LinkRepo, LinkSet, VfObject
 */
import { QVlike, QuantityValue, HoloObject, LinkSet, LinkRepo, VfObject, Hash } from "../lib/ts/common";
import "./chai/";
import { register, get, commit, getLinks, makeHash, update, remove } from "../../build/test/holo-mock/holochain-proto";

const expect = chai.expect;


namespace QV {
  let qvLike: QVlike = {
      units: "planck-lengths",
      quantity: 17
    };
  expect(() => new QuantityValue(qvLike), `a QuantityValue made from a QVlike`).not.to.throw;

  const realQv: QuantityValue = new QuantityValue({
      units: "planck-lengths",
      quantity: 20
    }),
    things: QVlike = {
      units: "things",
      quantity: 9001
    },
    percent: QVlike = {
      units: "%",
      quantity: 50
    },
    ownUnits:QVlike = {
      units: "",
      quantity: 10
    };



  // addition
  expect(() => realQv.add(qvLike), `QV + QV-Like`).not.to.throw;
  let expectSum = expect(realQv.add(qvLike), `20 planck lengths + 17 planck lengths`);
  expectSum.to.be.an.instanceof(QuantityValue);
  expectSum.to.have.property(`units`).that.equals(`planck-lengths`);
  expectSum.to.have.property(`quantity`).that.equals(37);

  expect(() => realQv.add(things), `planck lengths + things`).to.throw;
  expect(() => realQv.add(ownUnits), `planck lengths + (no unit)`).to.throw;

  expect(() => realQv.add(percent), `planck lengths + %`).to.not.throw;
  expectSum = expect(realQv.add(percent), `20 planck lengths + 50%`);
  expectSum.to.have.property(`units`).that.equals(`planck-lengths`);
  expectSum.to.have.property(`quantity`).that.equals(30);

  // subtraction
  expect(() => realQv.sub(qvLike), `QV - QV-like`).to.not.throw;
  let expectDif = expect(realQv.sub(qvLike));
  expectDif.to.be.an.instanceof(QuantityValue);
  expectDif.to.have.property(`units`).that.equals(`planck-lengths`);
  expectDif.to.have.property(`quantity`).that.equals(3);

  expect(() => realQv.sub(things), `planck lengths - things`).to.throw;
  expect(() => realQv.sub(ownUnits), `planck lengths - (no units)`).to.throw;

  expect(() => realQv.sub(percent), `planck lengths - %`).not.to.throw;
  expectDif = expect(realQv.sub(percent), `20 planck lengths - 50%`);
  expectDif.to.have.property(`units`).that.equals(`planck-lengths`);
  expectDif.to.have.property(`quantity`).that.equals(10);

  // That's all we need for now.
}

// -- Holo* and Link* --
namespace HoloThings {


  // <-- HoloObject

  namespace Obj {
    // The hairiest part is extending
    interface IPerson {
      name: string;
      iq: number;
      isBestEver: boolean;
      crimeProbability: number;
    }
    export class Person<T extends object = object> extends HoloObject<T & typeof HoloObject.entryType & IPerson> {
      static className = `Person`;
      className = `Person`;
      static entryType: IPerson & typeof HoloObject.entryType;
      static entryDefaults: IPerson & typeof HoloObject.entryType = Object.assign({}, HoloObject.entryDefaults, {
        name: "Jane Doe",
        iq: 100,
        isBestEver: false,
        crimeProbability: 0.05
      });

      constructor(entry: T & IPerson & typeof HoloObject.entryType, hash?: string) {
        super(entry, hash);
      }
      static create(props: IPerson & typeof HoloObject.entryType): Person {
        return <Person> super.create(props);
      }
      static get(hash: Hash<Person>): Person {
        return <Person> super.get(hash);
      }
      private isTheWorst() {
        return /Trump$/.test(this.myEntry.name);
      }

      get isSmart() {
        return !this.isTheWorst() && this.myEntry.iq > 100;
      }

      get isReallySmart() {
        return !this.isTheWorst() && this.myEntry.iq >= 140;
      }

      get isAtLeastSmarterThanGorilla() {
        return !this.isTheWorst() && this.myEntry.iq > 80;
      }

      get isVegetable() {
        return this.myEntry.iq < 10;
      }

      get wouldBeAnInsultToVegetables() {
        return this.isTheWorst();
      }

      get isBestEver() {
        return !this.isTheWorst() && this.myEntry.isBestEver;
      }

      get isProbablyCriminal() {
        return this.isTheWorst() || this.myEntry.crimeProbability > 0.5;
      }

      get isDefinitelyCriminal() {
        return this.isTheWorst() || this.myEntry.crimeProbability >= 1;
      }

      get willGetAwayWithIt() {
        return this.isReallySmart && this.isDefinitelyCriminal;
      }

      arrest: (otherPerson: Person) => void;

    }

    register({
      TypeName: `Person`,
      DataFormat: `json`,
      Exemplar: Person.entryDefaults
    });

    // Here in the United States, we have the best technology folks.
    // let's give it a try
    export const potus = Person.create({
      name: `Donald J Trump`,
      iq: 200,              // I'm like, really smart
      crimeProbability: 0,  // WITCH HUNT!
      isBestEver: true      // I would never say it, but, people are saying it
    });

    // Just the facts.
    export const agentMueller = Person.create({
      name: `Robert Mueller`,
      iq: 150,
      crimeProbability: 0,
      isBestEver: false
    });
  }

  namespace Links {
    register({
      TypeName: `People`,
      DataFormat: `links`
    });

    export const People = new LinkRepo<Obj.Person, Obj.Person, "putHandcuffsOn"|"receiveHandcuffsFrom">(`People`);
    People.linkBack(`putHandcuffsOn`, People, `receiveHandcuffsFrom`).linkBack(`receiveHandcuffsFrom`, People, `putHandcuffsOn`);

  }

  // together now
  namespace Obj {
     Person.prototype.arrest = function (otherPerson: Person): void {
       Links.People.put(this.hash, otherPerson.hash, `putHandcuffsOn`);
       if (otherPerson.isDefinitelyCriminal) {
         this.myEntry.isTheBest = true;
         this.update()
       }
     };
  }

  // Time for tests!
  expect(() => Obj.potus.commit(), `Committing potus as (arguably) a Person`).not.to.throw;
  expect(() => Obj.agentMueller.commit(), `Committing Agent Mueller`).not.to.throw;

  let potus: Obj.Person, mueller: Obj.Person;
  expect(() => (potus = Obj.Person.get(Obj.potus.hash)), `retrieving potus by hash`).not.to.throw;
  expect(() => (mueller = Obj.Person.get(Obj.agentMueller.hash)), `retrieving mueller from DHT`).not.to.throw;

  let expectPotus = expect(potus, `POTUS`), expectMueller = expect(mueller, `Agent Mueller`);

  expectPotus.to.exist; // somehow I feel sad.
  expectMueller.to.be.an.instanceof(Obj.Person);

  // Ok folks, let's check back on the results.  All I know is what I see on the internet.
  expectPotus.property(`isReallySmart`).to.be.false;
  // What?!
  expectPotus.property(`isVegetable`).to.be.false;
  // Well, it's not always wrong...
  expectPotus.property(`wouldBeAnInsultToVegetables`).to.be.true;
  // I never eat vegetables, so #$*& 'em!
  expectPotus.property(`isDefinitelyCriminal`).to.be.true;
  // but my twitter says NO COLLUSION!

  expectMueller.property(`isBestEver`).to.be.false;
  // life long republican, let's be honest
  expectMueller.property(`isReallySmart`).to.be.true;
  // Ok, I'll believe that.

  // How about this People thing?
  expect(() => Links.People.get(potus.hash), `Fetching Links`).not.to.throw;
  expect(Links.People.get(mueller.hash), `Current links`).to.be.empty;

  expect(() => mueller.arrest(potus), `Mueller arresting POTUS`).not.to.throw;
  // Fingers crossed
  expect(Obj.Person.get(mueller.hash).isBestEver, `DHT knows Mueller is now the best ever`).to.be.true;
  // works for me!

  // but let's make sure...
  let arrested = Links.People.get(potus.hash, `receiveHandcuffsFrom`);
  let others = Links.People.get(mueller.hash);

  expect(arrested.length, `Sets of handcuffs received by trump`).to.be.at.least(1);
  expect(arrested.hashes()[0], `Person who arrested POTUS`).to.equal(mueller.hash);
  expect(others.tags(`receiveHandcuffsFrom`), `Mueller's received handcuffs`).to.be.empty;

  // Would I even be surprised if he pardoned himself, though?
  expect(() => { arrested.removeAll(); }, `removing all arrested records`).not.to.throw;
  // yeah, he got away with it...
  arrested = Links.People.get(potus.hash, `receiveHandcuffsFrom`);
  expect(arrested, `Arrest records after self-pardon`).to.be.empty;
  expect(Links.People.get(mueller.hash), `Mueller's accomplishments`).to.be.empty;

  mueller = Obj.Person.get(mueller.hash);
  expect(mueller).to.have.property(`isTheBest`).that.equals(true); // I'll still love him for it.
}

namespace Vf {
  // every test I could do here, I think the above covers it.
  // and VfObject probably should be an abstract class.
}
