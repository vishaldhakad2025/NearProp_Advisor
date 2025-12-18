import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 4500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export const toastSuccess = (message = "Success") => {
  Toast.fire({
    icon: "success",
    title: message,
  });
};

export const toastError = (message = "Something went wrong!") => {
  Toast.fire({
    icon: "error",
    title: message,
  });
};

export const toastInfo = (message = "Info") => {
  Toast.fire({
    icon: "info",
    title: message,
  });
};

export const toastWarning = (message = "Warning!") => {
  Toast.fire({
    icon: "warning",
    title: message,
  });
};


// import { toast } from "react-toastify";

// export const toastSuccess = (message = "Success!") => {
//   toast.success(message);
// };

// export const toastError = (message = "Something went wrong!") => {
//   toast.error(message);
// };

// export const toastInfo = (message = "Here’s some info.") => {
//   toast.info(message);
// };

// export const toastWarning = (message = "Be careful!") => {
//   toast.warn(message);
// };
