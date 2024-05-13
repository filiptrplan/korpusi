import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { CardActionArea, Typography } from "@mui/material";
import { useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { AudioResult, SongResult } from "~/src/DataTypes";
import { secondsToString } from "~/utils/helpers";

interface Props {
  audio: SearchHit<AudioResult>;
}

export const CompareTitleAudio: React.FC<Props> = ({ audio}) => {
  const navigate = useNavigate();
  return (
    <CardActionArea
      sx={{
        borderRadius: 1,
        py: 1,
      }}
      onClick={() => {
        navigate(`/audio/${audio._id}`);
      }}
    >
      <Typography>{audio._source!.metadata.title}</Typography>
    </CardActionArea>
  );
};

export const CompareDurationAudio: React.FC<Props> = ({ audio}) => {
  const duration = secondsToString(audio._source!.sample_rate.file_info.duration);
  return <Typography>{duration}</Typography>;
};

export const CompareTempoAudio: React.FC<Props> = ({ audio}) => {
  const tempo = audio._source!.bpm.essentia_multifeature.bpm.toFixed(2);
  return <Typography>{tempo ?? "-"}</Typography>;
};

export const CompareKeyAudio: React.FC<Props> = ({ audio}) => {
  const keyExtract = audio._source?.key.essentia_key_extractor;
  const str = keyExtract ? keyExtract.key + " " + keyExtract.scale : "-"
  return <Typography>{str}</Typography>;
};
