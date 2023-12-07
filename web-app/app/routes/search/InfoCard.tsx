import { Paper, SxProps, Theme, Typography } from "@mui/material";
interface InfoCardProps {
  title: string;
  value: number | string | undefined | null;
  sx?: SxProps<Theme>;
}
export const InfoCard: React.FC<InfoCardProps> = ({ title, value, sx }) => {
  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          px: 1.7,
          py: 1,
          ...sx,
        }}
      >
        <Typography variant="caption">{title}</Typography>
        <Typography variant="h6" fontSize={"1.05rem"} lineHeight={"1.2rem"}>
          {value ?? "-"}
        </Typography>
      </Paper>
    </>
  );
};
