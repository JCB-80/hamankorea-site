/* toss — 카드 결제 화면 따라 만들기 */
(function () {
  "use strict";

  const luhn = (digits) => {
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      let n = Number(digits[i]);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  };

  window.LAB.add({
    id: "toss",
    name: "토스페이먼츠",
    original: "Toss Payments",
    tier: "extra",
    tag: "결제 UI",
    blurb:
      "카드 번호를 넣고 결제 버튼을 누르는 몇 초. 이 짧은 흐름을 얼마나 매끄럽게 만드느냐가 결제 UI의 전부입니다.",
    info: "결제 폼, 유효성 검사",
    mount(root) {
      const { el, fmt } = window.UI;
      const total = 21000;
      let processing = false;
      let timer = 0;

      const fields = {};
      const errors = {};

      const field = (key, label, attrs, extra) => {
        const input = el("input", Object.assign({ class: "input toss-input", id: `toss-${key}` }, attrs));
        const error = el("p", { class: "toss-err", id: `toss-${key}-err`, "aria-live": "polite" });
        fields[key] = input;
        errors[key] = error;
        return el(
          "div",
          { class: "toss-field" },
          el("label", { class: "toss-label", for: input.id }, label),
          input,
          error,
          extra || null
        );
      };

      const card = field(
        "card",
        "카드 번호",
        {
          type: "text",
          inputmode: "numeric",
          autocomplete: "off",
          placeholder: "0000 0000 0000 0000",
          maxlength: "19",
          "aria-describedby": "toss-card-err",
        }
      );
      const expiry = field("expiry", "유효기간", {
        type: "text",
        inputmode: "numeric",
        placeholder: "MM/YY",
        maxlength: "5",
        "aria-describedby": "toss-expiry-err",
      });
      const cvc = field("cvc", "CVC", {
        type: "password",
        inputmode: "numeric",
        placeholder: "000",
        maxlength: "3",
        "aria-describedby": "toss-cvc-err",
      });
      const pw = field("pw", "비밀번호 앞 2자리", {
        type: "password",
        inputmode: "numeric",
        placeholder: "00",
        maxlength: "2",
        "aria-describedby": "toss-pw-err",
      });

      fields.card.addEventListener("input", () => {
        const digits = fields.card.value.replace(/\D/g, "").slice(0, 16);
        fields.card.value = digits.replace(/(.{4})/g, "$1 ").trim();
      });
      fields.expiry.addEventListener("input", () => {
        const digits = fields.expiry.value.replace(/\D/g, "").slice(0, 4);
        fields.expiry.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
      });
      fields.cvc.addEventListener("input", () => {
        fields.cvc.value = fields.cvc.value.replace(/\D/g, "").slice(0, 3);
      });
      fields.pw.addEventListener("input", () => {
        fields.pw.value = fields.pw.value.replace(/\D/g, "").slice(0, 2);
      });

      const agree = el("input", { type: "checkbox", id: "toss-agree" });
      const submit = el("button", {
        class: "btn btn--primary toss-pay",
        type: "submit",
        text: `${fmt(total)}원 결제하기`,
      });
      const formError = el("p", { class: "toss-form-error", "aria-live": "polite" });

      const setError = (key, message) => {
        errors[key].textContent = message || "";
        fields[key].setAttribute("aria-invalid", message ? "true" : "false");
        return !message;
      };

      const clearErrors = () => {
        Object.keys(errors).forEach((key) => setError(key, ""));
        formError.textContent = "";
      };

      const validExpiry = (value) => {
        const match = /^(\d{2})\/(\d{2})$/.exec(value);
        if (!match) return false;
        const month = Number(match[1]);
        const year = 2000 + Number(match[2]);
        if (month < 1 || month > 12) return false;
        const now = new Date();
        return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
      };

      const validate = () => {
        clearErrors();
        let ok = true;
        const digits = fields.card.value.replace(/\D/g, "");
        if (digits.length !== 16) {
          ok = setError("card", "카드 번호 16자리를 입력해 주세요.") && ok;
        } else if (!luhn(digits)) {
          ok = setError("card", "카드 번호가 올바르지 않습니다.") && ok;
        }
        if (!validExpiry(fields.expiry.value)) {
          ok = setError("expiry", "MM/YY 형식의 유효한 날짜를 입력해 주세요.") && ok;
        }
        if (!/^\d{3}$/.test(fields.cvc.value)) {
          ok = setError("cvc", "CVC 3자리를 입력해 주세요.") && ok;
        }
        if (!/^\d{2}$/.test(fields.pw.value)) {
          ok = setError("pw", "비밀번호 앞 2자리를 입력해 주세요.") && ok;
        }
        if (!agree.checked) {
          formError.textContent = "결제 약관에 동의해 주세요.";
          ok = false;
        }
        return ok;
      };

      const receipt = el("div", { class: "toss-success", hidden: true });

      const showSuccess = () => {
        const digits = fields.card.value.replace(/\D/g, "");
        const now = new Date();
        const order = `SHB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
          now.getDate()
        ).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        receipt.hidden = false;
        receipt.replaceChildren(
          el("span", { class: "toss-success-mark", html: window.UI.icon("check", 26) }),
          el("span", { class: "mono", text: "결제 완료" }),
          el("p", { class: "toss-success-amount", text: `${fmt(total)}원` }),
          el(
            "dl",
            { class: "toss-receipt" },
            el("div", {}, el("dt", { text: "주문번호" }), el("dd", { class: "mono", text: order })),
            el("div", {}, el("dt", { text: "결제수단" }), el("dd", { text: `카드 **** ${digits.slice(-4)}` })),
            el("div", {}, el("dt", { text: "승인시각" }), el("dd", { text: now.toLocaleTimeString("ko-KR") })),
            el("div", {}, el("dt", { text: "상품" }), el("dd", { text: "아이디어웹 머그컵 1개" }))
          ),
          el("button", {
            class: "btn btn--sm btn--ghost",
            type: "button",
            text: "처음부터",
            onclick: () => {
              processing = false;
              submit.disabled = false;
              submit.textContent = `${fmt(total)}원 결제하기`;
              form.hidden = false;
              receipt.hidden = true;
              fields.card.value = "";
              fields.expiry.value = "";
              fields.cvc.value = "";
              fields.pw.value = "";
              agree.checked = false;
              clearErrors();
            },
          }),
          el("p", { class: "hint", text: "실제 결제가 아닙니다. 카드 정보는 서버로 전송되지 않습니다." })
        );
      };

      const form = el(
        "form",
        {
          class: "toss-form",
          onsubmit: (event) => {
            event.preventDefault();
            if (processing) return;
            if (!validate()) {
              const first = Object.keys(errors).find((key) => errors[key].textContent);
              if (first) fields[first].focus();
              return;
            }
            processing = true;
            submit.disabled = true;
            submit.textContent = "결제 중…";
            timer = window.setTimeout(() => {
              form.hidden = true;
              showSuccess();
            }, 1300);
          },
        },
        el(
          "div",
          { class: "toss-order" },
          el("span", { class: "mono toss-order-kicker", text: "주문서" }),
          el("h3", { class: "toss-order-title", text: "아이디어웹 머그컵" }),
          el(
            "dl",
            { class: "toss-order-list" },
            el("div", {}, el("dt", { text: "상품 금액" }), el("dd", { text: `${fmt(18000)}원` })),
            el("div", {}, el("dt", { text: "배송비" }), el("dd", { text: `${fmt(3000)}원` })),
            el("div", { class: "is-total" }, el("dt", { text: "총 결제 금액" }), el("dd", { text: `${fmt(total)}원` }))
          )
        ),
        card,
        el("div", { class: "toss-row" }, expiry, cvc, pw),
        el(
          "label",
          { class: "toss-agree", for: "toss-agree" },
          agree,
          el("span", { text: "실제 정보 없이 테스트 데이터만 입력한 데모 체험임을 확인합니다." })
        ),
        formError,
        submit,
        el("p", { class: "hint toss-note", text: "실제 카드·비밀번호 입력 금지. 테스트 데이터만 사용하세요: 4242 4242 4242 4242 / 12/30 / 123 / 12" })
      );

      root.append(
        el(
          "div",
          { class: "lab toss-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "결제 UI 데모 · 실제 결제 아님" }),
            el("span", { class: "mono", text: "CARD" })
          ),
          form,
          receipt
        )
      );

      return () => window.clearTimeout(timer);
    },
  });
})();
