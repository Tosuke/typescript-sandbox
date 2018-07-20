interface Bird {
    fly(): void
    layEggs(): void
}

interface Fish {
    swim(): void
    layEggs(): void
}

function isFish(sub: Bird | Fish): sub is Fish {
  return (<Fish>sub).swim !== undefined
}

let array: Array<Bird | Fish> = []

const good = array.filter(isFish) // <- Fish[]
const bad = array.filter(a => isFish(a)) // <- (Bird | Fish)[]
const good2 = array.filter((a): a is Fish => isFish(a)) // <- Fish[]