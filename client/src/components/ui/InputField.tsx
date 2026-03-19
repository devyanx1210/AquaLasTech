// InputField - reusable labeled input with error state support
import { FiEye, FiEyeOff } from "react-icons/fi"

export default function InputField({
    icon,
    placeholder,
    type = "text",
    value,
    onChange,
    showToggle,
    onToggle,
    show,
    required
}) {
    return (
        <div className="signup-input relative flex items-center">
            <span className="absolute left-3 text-blue-400 pointer-events-none">
                {icon}
            </span>

            <input
                type={showToggle ? (show ? "text" : "password") : type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full pl-10 pr-10 py-2 rounded-xl border border-blue-100 bg-white/80 text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all [&::-ms-reveal]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
            />

            {showToggle && (
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-3 text-gray-400 hover:text-blue-400 transition-colors"
                >
                    {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
            )}
        </div>
    );
}
