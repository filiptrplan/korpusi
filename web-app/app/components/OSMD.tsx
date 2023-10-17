import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { useMemo, useRef } from "react";

export interface OSMDProps {
  xml: string;
}

export default function OSMD({ xml }: OSMDProps) {
  const idContainer = useMemo(() => {
    return "testniID";
  }, []);
  const ref = useRef(null);
  const osmd = useMemo(() => {
    if (ref.current === null) return null;
    return new OpenSheetMusicDisplay(idContainer, { autoResize: false });
  }, [ref.current]);

  useMemo(() => {
    if (osmd === null) return;
    if (xml === "") return;
    osmd.load(xml).then(() => {
      osmd.render();
    });
  }, [osmd, xml]);

  return <div ref={ref} id={idContainer}></div>;
}
