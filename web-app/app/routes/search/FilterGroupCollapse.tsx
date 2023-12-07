import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import {
  Box,
  CardActionArea,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

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
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <Box sx={{ width: "100%" }}>
      <CardActionArea
        onClick={() => setIsCollapsed(!isCollapsed)}
        sx={{
          borderRadius: 1,
        }}
      >
        <Stack
          direction="row"
          alignItems={"center"}
          spacing={1}
          sx={{
            px: 1,
            py: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            fontSize={"1.05rem"}
            lineHeight={"1.2rem"}
          >
            {title}
          </Typography>
          <Divider
            sx={{
              flexGrow: 1,
            }}
          />
          {isCollapsed ? <ArrowDropDown /> : <ArrowDropUp />}
        </Stack>
      </CardActionArea>
      <Collapse in={!isCollapsed}>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </Collapse>
    </Box>
  );
};
