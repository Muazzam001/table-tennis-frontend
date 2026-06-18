import Swal from 'sweetalert2';

const toHtml = (text) => String(text ?? '').replace(/\n/g, '<br>');

const contentProps = (text) =>
  text.includes('\n') ? { html: toHtml(text) } : { text };

const AppSwal = Swal.mixin({
  customClass: {
    container: 'tt-swal-container',
    popup: 'tt-swal-popup',
    title: 'tt-swal-title',
    htmlContainer: 'tt-swal-html',
    confirmButton: 'tt-swal-btn tt-swal-btn--confirm',
    cancelButton: 'tt-swal-btn tt-swal-btn--cancel',
    actions: 'tt-swal-actions',
    icon: 'tt-swal-icon',
  },
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: false,
  heightAuto: false,
});

const resolveConfirmButtonClass = (variant) => {
  if (variant === 'danger') {
    return 'tt-swal-btn tt-swal-btn--danger';
  }
  return 'tt-swal-btn tt-swal-btn--confirm';
};

/**
 * Information or success alert (single OK button).
 */
export const showAlert = async (title, text = '', icon = 'info') => {
  await AppSwal.fire({
    icon,
    title,
    ...contentProps(text),
    confirmButtonText: 'OK',
  });
};

export const showSuccess = (title, text = '') => showAlert(title, text, 'success');

export const showError = (title, text = '') => showAlert(title, text, 'error');

export const showWarning = (title, text = '') => showAlert(title, text, 'warning');

/**
 * Confirmation dialog. Returns true if confirmed.
 * @param {string | {
 *   title: string,
 *   text?: string,
 *   confirmText?: string,
 *   cancelText?: string,
 *   icon?: string,
 *   variant?: 'primary' | 'danger'
 * }} options
 */
export const showConfirm = async (options) => {
  const resolved = typeof options === 'string' ? { title: options } : options;

  const {
    title,
    text = '',
    confirmText = 'Yes',
    cancelText = 'Cancel',
    icon = 'warning',
    variant = 'primary',
  } = resolved;

  const result = await AppSwal.fire({
    icon,
    title,
    ...contentProps(text),
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      container: 'tt-swal-container',
      popup: 'tt-swal-popup',
      title: 'tt-swal-title',
      htmlContainer: 'tt-swal-html',
      confirmButton: resolveConfirmButtonClass(variant),
      cancelButton: 'tt-swal-btn tt-swal-btn--cancel',
      actions: 'tt-swal-actions',
      icon: 'tt-swal-icon',
    },
  });

  return result.isConfirmed;
};

/**
 * Text/number input prompt. Returns value or null if cancelled.
 */
export const showPrompt = async ({
  title,
  text = '',
  input = 'text',
  inputLabel,
  inputValue = '',
  inputAttributes,
  confirmText = 'OK',
  cancelText = 'Cancel',
  inputValidator,
}) => {
  const result = await AppSwal.fire({
    title,
    ...(text ? contentProps(text) : {}),
    input,
    inputLabel,
    inputValue,
    inputAttributes,
    inputValidator,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });

  if (result.isDismissed) {
    return null;
  }

  return result.value;
};

export default AppSwal;
