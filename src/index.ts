import { sleep } from "$utils/index"

void(async () => {
    await sleep(1000)
    console.log("Hello, world!")
})()
    .catch(console.error)
