import {
  Stack,
  Typography,
  Divider,
  Button,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from "@mui/material";
import { useNavigate, useNavigation, useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
interface ResultListProps {
  pagination: {
    current: number;
    total: number;
    totalHits: number;
    pageSize: number;
  };
  resultRows: JSX.Element[];
}

export const ResultList: React.FC<ResultListProps> = ({
  pagination,
  resultRows,
}) => {
  const { t } = useTranslation("search");
  const navigation = useNavigation();
  const searching = typeof navigation.state == 'undefined' || navigation.state !== "idle";
  const navigate = useNavigate();

  const [params] = useSearchParams();

  return (
    <>
      <Stack
        direction={"row"}
        sx={{
          width: "100%",
          my: 1,
        }}
        alignContent={"center"}
        alignItems={"center"}
      >
        <Typography
          variant="caption"
          sx={{
            whiteSpace: "nowrap",
          }}
        >
          {t("results", { count: pagination.totalHits })}
        </Typography>
        <Divider sx={{ mx: 1, flexGrow: 1 }} />
        <Button variant="text" size="small">
          Izberi dela
        </Button>
      </Stack>
      <Box
        sx={{
          position: "relative",
        }}
      >
        <CircularProgress
          sx={{
            opacity: searching ? 1 : 0,
            zIndex: 100,
            position: "absolute",
            left: "50%",
            top: "50%",
            marginLeft: "-1rem",
            marginTop: "-1rem",
            transition: "opacity 0.35s ease",
          }}
        />
        <Stack
          spacing={1.5}
          sx={{
            mt: 1,
            opacity: searching ? 0.5 : 1,
            transition: "opacity 0.35s ease",
            minHeight: "5rem",
          }}
        >
          {resultRows}
        </Stack>
      </Box>
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        alignItems={"center"}
        justifyContent={"center"}
        gap={2}
        sx={{
          mt: 2,
        }}
      >
        <FormControl size="small">
          <InputLabel id="page-size-label">Št. na stran</InputLabel>
          <Select
            labelId="page-size-label"
            defaultValue={10}
            sx={{
              minWidth: "7rem",
            }}
            size="small"
            label="Št. na stran"
            value={pagination.pageSize}
            onChange={(e) => {
              const link = new URLSearchParams(params);
              const pageSize = parseInt(e.target.value as string);
              link.set("pageSize", e.target.value.toString());
              if (pageSize * (pagination.current - 1) > pagination.totalHits) {
                link.set(
                  "page",
                  Math.ceil(pagination.totalHits / pageSize).toString(),
                );
              }
              navigate(`?${link.toString()}`);
            }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
        <Pagination
          count={pagination.total}
          page={pagination.current}
          onChange={(e, page) => {
            const link = new URLSearchParams(params);
            link.set("page", page ? page.toString() : "1");
            navigate(`?${link.toString()}`);
          }}
        />
      </Stack>
    </>
  );
};
