import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CardActionArea,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

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
      localStorage.getItem("collapsedList") || "{}"
    );
    collapsedList[title] = isCollapsed;
    localStorage.setItem("collapsedList", JSON.stringify(collapsedList));
  }, [isCollapsed]);

  useEffect(() => {
    const collapsedList = JSON.parse(
      localStorage.getItem("collapsedList") || "{}"
    );
    setIsCollapsed(
      typeof collapsedList[title] === "boolean"
        ? collapsedList[title]
        : defaultCollapsed
    );
  }, []);

  return (
    <Accordion
      sx={{
        width: "100%",
        overflow: "hidden",
        borderRadius: 1,
      }}
      elevation={0}
      disableGutters
      variant="outlined"
      expanded={!isCollapsed}
      onChange={() => {
        setIsCollapsed(!isCollapsed);
      }}
    >
      <AccordionSummary expandIcon={<ArrowDropDown />}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );

  // return (
  //   <Box sx={{ width: "100%" }}>
  //     <CardActionArea
  //       onClick={() => setIsCollapsed(isCollapsed ? false : true)}
  //       sx={{
  //         borderRadius: 1,
  //       }}
  //     >
  //       <Stack
  //         direction="row"
  //         alignItems={"center"}
  //         spacing={1}
  //         sx={{
  //           px: 1,
  //           py: 1,
  //         }}
  //       >
  //         <Typography
  //           variant="subtitle1"
  //           fontSize={"1.05rem"}
  //           lineHeight={"1.2rem"}
  //         >
  //           {title}
  //         </Typography>
  //         <Divider
  //           sx={{
  //             flexGrow: 1,
  //           }}
  //         />
  //         {isCollapsed ? <ArrowDropDown /> : <ArrowDropUp />}
  //       </Stack>
  //     </CardActionArea>
  //     <Collapse in={isCollapsed === null ? !defaultCollapsed : !isCollapsed}>
  //       <Box sx={{ pt: 1 }}>{children}</Box>
  //     </Collapse>
  //   </Box>
  // );
};
