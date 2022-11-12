/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
    closestCenter,
    CollisionDetection,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    getFirstCollision,
    KeyboardSensor,
    MeasuringStrategy,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Bucket from "./Bucket";
import Card from "./Card";
import data, { Kanban } from "./data";

export default function App() {
    const [kanban, updateKanban] = useState({
        ...data,
        done: [],
    });
    const [activeCard, setActiveCard] = useState<{ id: string; label: string }>();
    const lastOverId = useRef<UniqueIdentifier | null>(null);
    const recentlyMovedToNewContainer = useRef(false);

    const collisionDetectionStrategy: CollisionDetection = useCallback(
        (args) => {
            // Start by finding any intersecting droppable
            const pointerIntersections = pointerWithin(args);
            const intersections =
                pointerIntersections.length > 0
                    ? // If there are droppables intersecting with the pointer, return those
                      pointerIntersections
                    : rectIntersection(args);
            let overId = getFirstCollision(intersections, "id");

            if (overId != null) {
                if (overId in kanban) {
                    const containerItems = kanban[overId as keyof Kanban];

                    // If a container is matched and it contains items (columns 'A', 'B', 'C')
                    if (containerItems.length > 0) {
                        // Return the closest droppable within that container
                        overId = closestCenter({
                            ...args,
                            droppableContainers: args.droppableContainers.filter(
                                (container) =>
                                    container.id !== overId &&
                                    containerItems.some((x) => x.id === container.id)
                            ),
                        })[0]?.id;
                    }
                }

                lastOverId.current = overId;

                return [{ id: overId }];
            }

            // When a draggable item moves to a new container, the layout may shift
            // and the `overId` may become `null`. We manually set the cached `lastOverId`
            // to the id of the draggable item that was moved to the new container, otherwise
            // the previous `overId` will be returned which can cause items to incorrectly shift positions
            if (recentlyMovedToNewContainer.current && activeCard) {
                lastOverId.current = activeCard.id;
            }

            // If no droppable is matched, return the last match
            return lastOverId.current ? [{ id: lastOverId.current }] : [];
        },
        [activeCard, kanban]
    );

    useEffect(() => {
        requestAnimationFrame(() => {
            recentlyMovedToNewContainer.current = false;
        });
    }, [kanban]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function findKey(kanban: Kanban, id: UniqueIdentifier): keyof Kanban | undefined {
        if (id in kanban) return id as keyof Kanban;
        return Object.keys(kanban).find((key) =>
            kanban[key as keyof Kanban]?.some((x) => x.id === id)
        ) as keyof Kanban | undefined;
    }

    function findIndex(kanban: Kanban, id: UniqueIdentifier) {
        const key = findKey(kanban, id);
        if (!key) return -1;

        return kanban[key].findIndex((x) => x.id === id);
    }

    function handleDragStart(e: DragStartEvent) {
        const key = e.active.data.current?.sortable?.containerId as keyof Kanban;

        if (key) {
            setActiveCard(kanban[key][findIndex(kanban, e.active.id)]);
        }
    }

    function handleDragOver(e: DragOverEvent) {
        const { active, over } = e;
        if (!over) return;

        const activeContainer = findKey(kanban, active.id);
        const overContainer = findKey(kanban, over.id);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        updateKanban((previous) => {
            const activeIndex = findIndex(previous, active.id);
            const overIndex = findIndex(previous, over.id);

            const newIndex = (() => {
                if (over.id in previous)
                    return previous[over.id as keyof typeof previous].length + 1;

                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;

                return overIndex >= 0 ? overIndex + modifier : previous[overContainer].length + 1;
            })();

            return {
                ...previous,
                [activeContainer]: previous[activeContainer].filter((x) => x.id !== active.id),
                [overContainer]: [
                    ...previous[overContainer].slice(0, newIndex),
                    previous[activeContainer][activeIndex],
                    ...previous[overContainer].slice(newIndex, previous[overContainer].length),
                ],
            };
        });

        recentlyMovedToNewContainer.current = true;
    }

    function handleDragEnd(e: DragEndEvent) {
        const { active, over } = e;

        if (!over) return;
        if (active.id === over.id) return;

        const activeContainerId = active.data.current?.sortable?.containerId as keyof Kanban;
        const overContainerId = over.data.current?.sortable?.containerId as keyof Kanban;

        if (activeContainerId !== overContainerId) return;

        updateKanban((previous) => {
            const aIndex = findIndex(previous, active.id);
            const oIndex = findIndex(previous, over.id);

            return {
                ...previous,
                [overContainerId]: arrayMove(previous[overContainerId], aIndex, oIndex),
            };
        });

        setActiveCard(undefined);
    }

    return (
        <div className="flex flex-row gap-4">
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetectionStrategy}
                measuring={{
                    droppable: {
                        strategy: MeasuringStrategy.Always,
                    },
                }}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}>
                <Bucket cards={kanban.todo} title="Todo" kanbanKey="todo" />
                <Bucket cards={kanban.inProgress} title="In Progress" kanbanKey="inProgress" />
                <Bucket cards={kanban.done} title="Done" kanbanKey="done" />

                {createPortal(
                    <DragOverlay>
                        {(() => {
                            if (!activeCard) return null;
                            return <Card id={activeCard.id} label={activeCard.label} isOverlay />;
                        })()}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    );
}
