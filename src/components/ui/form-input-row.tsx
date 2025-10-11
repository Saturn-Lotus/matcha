import { Input } from "@/components/ui/input";
import React from "react";

interface FormInputRowProps {
  icon: React.ReactNode;
  id: string;
  type: string;
  placeholder: string;
  required?: boolean;
}

const FormInputRow =({
  icon,
  id,
  type,
  placeholder,
  required = false,
}: FormInputRowProps) => {
  return (
    <div className="border border-gray-300 rounded-sm h-10 flex items-center px-3">
      {icon}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className="text-gray-500"
        required={required}
      />
    </div>
  );
}

export default FormInputRow;