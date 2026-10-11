import { DaoSetup } from "../_components/DaoSetup";
import { ProfileSection } from "./_components/ProfileSection";
import type { NextPage } from "next";

const ProfilePage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <ProfileSection />
    </main>
  );
};

export default ProfilePage;
