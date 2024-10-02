import { useEffect, useState } from "react";
import { MAccordion } from "~/components/MAccordion";

interface FilterGroupCollapseProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export const FilterGroupCollapse: React.FC<FilterGroupCollapseProps> = ({
  title,
  children,
  defaultCollapsed = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    if (isCollapsed === null) {
      return;
    }
    const collapsedList = JSON.parse(
      localStorage.getItem("collapsedList") || "{}",
    );
    collapsedList[title] = isCollapsed;
    localStorage.setItem("collapsedList", JSON.stringify(collapsedList));
  }, [isCollapsed]);

  useEffect(() => {
    const collapsedList = JSON.parse(
      localStorage.getItem("collapsedList") || "{}",
    );
    setIsCollapsed(
      typeof collapsedList[title] === "boolean"
        ? collapsedList[title]
        : defaultCollapsed,
    );
  }, []);

  return (
    <MAccordion
      title={title}
      sx={{
        width: "100%",
        overflow: "visible"
      }}
      expanded={isCollapsed == null ? !defaultCollapsed : !isCollapsed}
      onChange={() => {
        setIsCollapsed(!isCollapsed);
      }}
      titleTypographyProps={{
        variant: undefined,
      }}
    >
      {children || ""}
    </MAccordion>
  );
};
