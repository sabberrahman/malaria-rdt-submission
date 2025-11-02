import { FileText } from "lucide-react";
import { FcSurvey } from "react-icons/fc";
import { RiSurveyFill } from "react-icons/ri";

export default function Header() {
    return (
        <header className="w-full bg-[#0060bf] text-white shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center p-4">
                <RiSurveyFill className="w-6 h-6 text-white mr-2" />
                <span className="text-lg font-semibold text-white">RDT BSE</span>
            </div>
        </header>
    );
}
