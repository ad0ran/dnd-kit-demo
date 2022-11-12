import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { ComponentPropsWithRef } from "react";

interface CardProps {
    id: string;
    label: string;
    isOverlay?: boolean;
}

export default function Card(
    props: Omit<ComponentPropsWithRef<"div">, keyof CardProps> & CardProps
) {
    const { id, label, style, isOverlay = false, ...rest } = props;
    const { listeners, attributes, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            id={id}
            style={{
                transition,
                transform: CSS.Transform.toString(transform),
                ...style,
            }}
            className={clsx(
                "bg-primary p-4 rounded-md shadow-black shadow-sm w-full aspect-video",
                {
                    ["opacity-50"]: isDragging,
                    ["cursor-grab"]: !isOverlay,
                    ["cursor-grabbing"]: isOverlay,
                }
            )}
            {...attributes}
            {...listeners}
            {...rest}>
            <span>{label}</span>
        </div>
    );
}
