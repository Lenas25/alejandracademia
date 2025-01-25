"use client";


import { User } from "@/types/user";
import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { IconArrowRight } from "@tabler/icons-react";
import { useEffect } from "react";

interface DragAndDropProps {
  enrollments : User[];
  users : User[];
  onEnrollmentChange : (newEnrollment: User[]) => void;
}

function DragAndDrop({ enrollments, users, onEnrollmentChange }: DragAndDropProps) {
  const [enrollmentBoard, enrollment] = useDragAndDrop<HTMLUListElement, User>(
    enrollments,
    {
      group: "enrollmentUsers",
    }
  );
  const [usersBoard, usersAll] = useDragAndDrop<HTMLUListElement, User>(users, {
    group: "enrollmentUsers",
  });

  useEffect(() => {
    onEnrollmentChange(enrollment);
  }, [enrollment, onEnrollmentChange]);

  return (
    <div className="flex flex-col gap-5 justify-between w-full md:flex-row ">
      <ul ref={enrollmentBoard} className="bg-flamingo p-5 rounded-lg h-[250px] overflow-y-auto flex flex-col gap-2 md:w-full">
        {enrollment.map((en) => (
          <li className="flex gap-2 w-full bg-white rounded-lg p-2" key={en.id}>
            {en.name} {en.lastName}
          </li>
        ))}
      </ul>
      <ul ref={usersBoard} className="p-5 h-[250px] flex flex-col gap-2 overflow-y-auto md:w-full">
        {usersAll.map((us) => (
          <li className="flex gap-2 w-full border-2 border-black rounded-lg p-2 md:flex-col text-left" key={us.id}>
            <span>
              {us.id}
            </span>
            <IconArrowRight className="md:hidden" />
            <span>
            {us.name} {us.lastName}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DragAndDrop;
