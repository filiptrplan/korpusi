import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import {
  Accordion,
  AccordionDetails,
  AccordionProps,
  AccordionSummary,
  Typography,
  TypographyProps,
} from "@mui/material";

export const MAccordion = (
  props: AccordionProps & {
    title: string;
    titleTypographyProps?: TypographyProps;
  },
) => {
  const { title, sx, titleTypographyProps, ...rest } = props;
  return (
    <Accordion
      variant="outlined"
      disableGutters
      defaultExpanded={true}
      sx={{
        overflow: "hidden",
        borderRadius: 1,
        my: 1,
        ...sx,
      }}
      {...rest}
    >
      <AccordionSummary expandIcon={<ArrowDropDown />}>
        <Typography variant="h5" {...titleTypographyProps}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{props.children}</AccordionDetails>
    </Accordion>
  );
};
