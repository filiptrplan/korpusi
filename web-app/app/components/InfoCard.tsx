import { Paper, SxProps, Theme, Typography } from "@mui/material";
interface InfoCardProps {
  title: string;
  value: number | string | undefined | null | JSX.Element;
  variant?: "normal" | "large";
  sx?: SxProps<Theme>;
}
export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  value,
  sx,
  variant,
}) => {
  const isLarge = variant === "large";
  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          px: 1.7,
          py: isLarge ? 1.3 : 1,
          ...sx,
        }}
      >
        <Typography
          variant={isLarge ? "h5" : "caption"}
          fontSize={isLarge ? "1.5rem" : undefined}
          fontWeight={isLarge ? 500 : undefined}
          lineHeight={isLarge ? "1.75rem" : undefined}
        >
          {title}
        </Typography>
        <Typography
          variant={isLarge ? "body1" : "h6"}
          fontSize={isLarge ? "1.75rem" : "1.05rem"}
          lineHeight={isLarge ? "2.25rem" : "1.25rem"}
        >
          {value ?? "-"}
        </Typography>
      </Paper>
    </>
  );
};
