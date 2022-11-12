import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ComponentPropsWithRef } from "react";
import Card from "./Card";
import { Kanban } from "./data";

interface BucketProps {
    title: string;
    cards: Array<{ id: string; label: string }>;
    kanbanKey: keyof Kanban;
}

export default function Bucket(
    props: Omit<ComponentPropsWithRef<"div">, keyof BucketProps> & BucketProps
) {
    const { cards, className, title, kanbanKey, ...rest } = props;
    const { setNodeRef } = useDroppable({
        id: kanbanKey,
    });

    return (
        <div
            className={`w-[300px] bg-light flex flex-col p-4 gap-4 ${className ?? ""}`.trim()}
            {...rest}>
            <h2 className="text-primary">{title}</h2>

            <SortableContext id={kanbanKey} items={cards} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} className="w-full flex flex-col gap-4 flex-1">
                    {cards.map((card) => {
                        return <Card key={card.id} id={card.id} label={card.label} />;
                    })}
                </div>
            </SortableContext>
        </div>
    );
}
