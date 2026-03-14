import React, { useState } from "react";
import SideNav from "@/components/App/SideBar/SideNav";

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

export default function POSLayout({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ display: "flex", overflowY:'hidden' }}>
      <SideNav open={open} setOpen={setOpen} />

      <div
        style={{
          flexGrow: 1,
          marginLeft: 0, // <-- set to 0, let flexbox handle the width
          marginTop: '5rem',
          transition: 'margin-left 0.3s ease-in-out',
          overflowX: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
