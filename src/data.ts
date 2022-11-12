import { LoremIpsum } from "lorem-ipsum";
import { customAlphabet } from "nanoid";
import { nolookalikesSafe } from "nanoid-dictionary";

const nanoid = customAlphabet(nolookalikesSafe);

const lorem = new LoremIpsum({
    wordsPerSentence: {
        min: 3,
        max: 20,
    },
});

function generate(): Array<{ id: string; label: string }> {
    const n = Math.floor(Math.random() * 10) + 1;
    return [...new Array<unknown>(n)].map(() => {
        return {
            id: nanoid(),
            label: lorem.generateWords(),
        };
    });
}

const kanban = {
    todo: generate(),
    inProgress: generate(),
    done: generate(),
};

export default kanban;
export type Kanban = typeof kanban;
