import { useContext } from "react";
import { songsContext } from "./CompareList";
import { ContourGraph } from "~/components/ContourGraph";

export const CompareContour: React.FC = ({}) => {
  const songs = useContext(songsContext);
  return <ContourGraph songs={songs} />;
};
