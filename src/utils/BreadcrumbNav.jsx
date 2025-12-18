import React from 'react';
import { Breadcrumb } from 'antd';
import { ArrowLeft, ArrowRight, Home, LayoutDashboard, Users, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const iconMap = {
  dashboard: <LayoutDashboard size={16} className="inline-block mr-1" />,
  users: <Users size={16} className="inline-block mr-1" />,
  settings: <Settings size={16} className="inline-block mr-1" />,
};

export default function BreadcrumbNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const breadcrumbItems = [
    {
      title: (
        <span
          className="text-blue-600 cursor-pointer hover:underline flex items-center gap-1"
          onClick={() => navigate("/")}
        >
          <Home size={16} /> Home
        </span>
      ),
    },
    ...pathSegments.map((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
      const label = decodeURIComponent(segment.charAt(0).toUpperCase() + segment.slice(1));
      const isLast = index === pathSegments.length - 1;

      const icon = iconMap[segment.toLowerCase()] || null;

      return {
        title: isLast ? (
          <span className="text-gray-500 flex items-center ">
            {icon} {label}
          </span>
        ) : (
          <span
            className="text-blue-800 cursor-pointer hover:underline flex items-center"
            onClick={() => navigate(path)}
          >
         {label}
          </span>
        ),
      };
    }),
  ];

  return (
    <div className="flex items-center justify-between p-2 mb-2">
      <div className="flex items-center ">
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded hidden md:flex hover:bg-gray-100 transition"
          aria-label="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => window.history.forward()}
          className="p-1 rounded hidden md:flex hover:bg-gray-100 transition"
          aria-label="Go Forward"
        >
          <ArrowRight size={18} />
        </button>

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </div>
  );
}
