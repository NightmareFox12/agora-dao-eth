import { NextPage } from "next";
import { LoginForm } from "~~/components/LoginForm";

const LoginPage: NextPage = () => {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
};

export default LoginPage;
