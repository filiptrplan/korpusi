import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { CardActionArea, Typography } from "@mui/material";
import { useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { SongResult } from "~/src/DataTypes";

interface Props {
  song: SearchHit<SongResult>;
}

export const CompareTitle: React.FC<Props> = ({ song }) => {
  const navigate = useNavigate();
  return (
    <CardActionArea
      sx={{
        borderRadius: 1,
        py: 1,
      }}
      onClick={() => {
        navigate(`/xml/${song._id}`);
      }}
    >
      <Typography>{song._source!.metadata.title}</Typography>
    </CardActionArea>
  );
};

export const CompareTempo: React.FC<Props> = ({ song }) => {
  const tempo = song._source!.tempo;
  return <Typography>{tempo ?? "-"}</Typography>;
};

export const CompareKey: React.FC<Props> = ({ song }) => {
  const { t } = useTranslation("search");
  const key = song._source!.key.most_certain_key;
  const keyString = t(key);
  return <Typography>{key ? keyString : "-"}</Typography>;
};

export const CompareTimeSignature: React.FC<Props> = ({ song }) => {
  const timeSignature = song._source!.time_signature;
  return <Typography>{timeSignature ?? "-"}</Typography>;
};

export const CompareAmbitus: React.FC<Props> = ({ song }) => {
  const ambitus = song._source!.ambitus.ambitus_semitones;
  return <Typography>{ambitus ?? "-"}</Typography>;
};
