interface IAnimal {
  name: string;
}

interface IDog extends IAnimal {
  age: number;
}

interface ICat extends IAnimal {
  nickName: string;
}

function feed(param: IAnimal) {}
function feedDog(param: IDog) {}


let y = feed;
y = feedDog;
