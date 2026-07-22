"use client";
import CuadrosAsignar from "./CuadrosAsignar";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Section } from "@/types/section";
import { useEffect, useState } from "react";
import { fetchSections } from "@/redux/service/sectionService";
import RowCursosHead from "../../RowCursosHead";

export function TableAsignar() {
  const dispatch = useAppDispatch();
  // A catalog "coming soon" placeholder never has real Sections created
  // under it, so no further filtering is needed here (unlike the old
  // Course-based list, which mixed catalog and section data).
  const sections = useAppSelector((state) => state.section.sections);
  const [translate, setTranslate] = useState<number>(0);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const handleSelectSection = (section: Section) => {
    setSelectedSection(section);
  };

  useEffect(() => {
    dispatch(fetchSections());
  }, [dispatch]);

  return (
    <>
      <RowCursosHead
        translate={translate}
        setTranslate={setTranslate}
        selectedSection={selectedSection}
        sections={sections}
        handleSelectSection={handleSelectSection}
      />
      <CuadrosAsignar selectedSection={selectedSection} />
    </>
  );
}
