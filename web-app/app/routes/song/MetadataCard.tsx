import { Box, Card, CardContent, List } from "@mui/material";
import { useMemo } from "react";
import { SongResult } from "~/src/DataTypes";

export interface MetadataCardProps {
  song: SongResult;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({ song }) => {
  const { metadata } = song;
  const listItems = useMemo(() => {
    if (!metadata) return null;
    const items = Object.entries(metadata).map(([key, value]) => {
      return (
        <li key={key}>
          <strong>{key}</strong>: {value as string}
        </li>
      );
    });
    return items;
  }, [metadata]);
  return (
    <Card>
      <CardContent
        sx={{
          padding: 1,
          paddingBottom: 1,
          "&:last-child": {
            paddingBottom: 1,
          },
        }}
      >
        <Box
          sx={{
            typography: "body2",
          }}
        >
          <ul
            style={{
              listStyle: "inside",
              paddingInlineStart: "1.5rem",
            }}
          >
            {listItems}
          </ul>
        </Box>
      </CardContent>
    </Card>
  );
};
