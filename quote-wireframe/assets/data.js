/* 도면 — 블록·옵션·템플릿 데이터
   블록 레코드: { id, type, label, gridSpan, colStart, rows, featureLevel, options }
   featureLevel 은 선택된 옵션의 최고 등급에서 계산됩니다. */
(function (global) {
  'use strict';

  var LEVELS = {
    1: { n: 1, name: 'Level 1', tag: '기본' },
    2: { n: 2, name: 'Level 2', tag: '백엔드' },
    3: { n: 3, name: 'Level 3', tag: '고난도' }
  };

  var COST = {
    setup: 1.5,           // 반응형 공통 작업
    page: 1.0,            // 페이지 한 장 추가(레이아웃·메뉴 연결)
    level: { 1: 0.4, 2: 1.0, 3: 2.0 },
    option: { 1: 0.08, 2: 0.22, 3: 0.5 },
    lowRate: 0.85,
    highRate: 1.3,
    unitPrice: 550000     // 인·일 단가 기본값 (편집 가능)
  };

  /* ── 블록 타입 12종 ─────────────────────────────────────────── */
  var TYPES = {
    hero: {
      group: '전환', name: '상단 버튼 / 배너', level: 1, span: 12, rows: 4,
      hint: '첫 화면에서 바로 누를 곳',
      fallback: '지정 URL·섹션으로 이동하는 정적 CTA 영역',
      options: [
        { id: 'link', name: '외부 링크', level: 1, spec: '지정 URL로 이동하는 정적 CTA 버튼' },
        { id: 'tel', name: '전화 연결', level: 1, spec: '모바일에서 전화 앱으로 연결되는 tel 링크' },
        { id: 'scroll', name: '섹션 스크롤', level: 1, spec: '같은 페이지의 섹션으로 스크롤 이동' },
        { id: 'banner', name: '배너 슬라이드', level: 2, spec: '2~5장 이미지를 자동 전환하는 슬라이드 배너' }
      ]
    },
    contact: {
      group: '전환', name: '문의하기 박스', level: 2, span: 5, rows: 3,
      hint: '입력값이 어디로 가는지 정합니다',
      fallback: '이름·연락처만 받는 문의 폼',
      options: [
        { id: 'mail', name: '이메일 발송', level: 2, spec: '제출 시 담당자 이메일로 전송' },
        { id: 'alimtalk', name: '알림톡 발송', level: 2, spec: '카카오 알림톡 템플릿 발송' },
        { id: 'db', name: '관리자 DB 저장', level: 2, spec: '입력값 검증 후 DB 저장' },
        { id: 'attach', name: '파일 첨부', level: 2, spec: '이미지·PDF 첨부 업로드와 용량 제한' }
      ]
    },
    booking: {
      group: '기능', name: '일정·예약 모듈', level: 3, span: 6, rows: 4,
      hint: '가장 오래 걸리는 구간입니다',
      fallback: '날짜를 문자로 받는 간이 예약 폼',
      options: [
        { id: 'date', name: '날짜 선택', level: 3, spec: '달력에서 날짜·시간 선택' },
        { id: 'capacity', name: '정원 관리', level: 3, spec: '실시간 잔여 슬롯 조회 및 마감 처리' },
        { id: 'pg', name: 'PG 결제 연동', level: 3, spec: 'PG사 결제창 호출과 승인 검증' },
        { id: 'confirm', name: '확정 알림', level: 2, spec: '예약 확정 시 알림 발송' }
      ]
    },
    board: {
      group: '기능', name: '목록·게시판 영역', level: 2, span: 6, rows: 3,
      hint: '누가 쓰고 누가 읽는지',
      fallback: '관리자만 등록하는 공지 목록',
      options: [
        { id: 'notice', name: '단순 공지', level: 2, spec: '관리자 등록 공지 목록·상세 보기' },
        { id: 'write', name: '회원 글쓰기', level: 3, spec: '회원 권한별 글쓰기·수정·삭제' },
        { id: 'filter', name: '검색 필터', level: 3, spec: '카테고리·키워드 필터와 페이지네이션' },
        { id: 'file', name: '첨부파일', level: 2, spec: '게시글 첨부파일 업로드·다운로드' }
      ]
    },
    pricing: {
      group: '전환', name: '가격·상품 목록', level: 2, span: 12, rows: 4,
      hint: '무엇을 얼마에 파는지',
      fallback: '가격이 적힌 상품 카드 목록',
      options: [
        { id: 'table', name: '가격표', level: 2, spec: '항목·금액을 정리한 비교 표' },
        { id: 'option', name: '상품 옵션', level: 3, spec: '색상·규격 등 옵션에 따른 금액 변경' },
        { id: 'cart', name: '장바구니', level: 3, spec: '장바구니 담기와 주문서 작성' },
        { id: 'pay', name: '결제 연동', level: 3, spec: 'PG 결제창 호출과 주문 완료 처리' }
      ]
    },
    gallery: {
      group: '콘텐츠', name: '이미지 갤러리', level: 2, span: 6, rows: 4,
      hint: '보여줄 사진의 양과 방식',
      fallback: '이미지를 나란히 보여주는 정적 목록',
      options: [
        { id: 'slider', name: '슬라이드', level: 2, spec: '좌우로 넘기는 이미지 슬라이드' },
        { id: 'lightbox', name: '확대 보기', level: 2, spec: '이미지 클릭 시 원본 크기로 확대' },
        { id: 'album', name: '앨범 분류', level: 2, spec: '카테고리별 앨범 탭' }
      ]
    },
    map: {
      group: '기능', name: '오시는 길·지도', level: 1, span: 5, rows: 3,
      hint: '방문 전에 확인하는 정보',
      fallback: '주소를 텍스트로 표시',
      options: [
        { id: 'embed', name: '지도 삽입', level: 1, spec: '주소를 지도에 표시' },
        { id: 'directions', name: '길찾기 링크', level: 1, spec: '지도 앱으로 길찾기 연결' },
        { id: 'hours', name: '영업시간', level: 1, spec: '요일별 영업시간과 휴무일 표기' }
      ]
    },
    faq: {
      group: '구조', name: '자주 묻는 질문', level: 1, span: 7, rows: 2,
      hint: '반복 문의를 줄이는 영역',
      fallback: '질문과 답변을 나열한 정적 목록',
      options: [
        { id: 'accordion', name: '아코디언', level: 1, spec: '질문을 누르면 답변이 열리는 목록' },
        { id: 'search', name: '질문 검색', level: 2, spec: '키워드로 질문을 찾는 검색' }
      ]
    },
    team: {
      group: '콘텐츠', name: '팀·전문가 소개', level: 1, span: 6, rows: 3,
      hint: '누가 하는지를 보여줍니다',
      fallback: '이름과 직책을 적은 인물 목록',
      options: [
        { id: 'profile', name: '인물 카드', level: 1, spec: '이름·직책·한 줄 소개 카드' },
        { id: 'detail', name: '인물 상세', level: 2, spec: '인물별 상세 이력 페이지' },
        { id: 'sns', name: '외부 프로필', level: 1, spec: '링크드인 등 외부 프로필 연결' }
      ]
    },
    login: {
      group: '기능', name: '회원 로그인', level: 2, span: 4, rows: 2,
      hint: '회원 기능이 필요할 때만',
      fallback: '이메일·비밀번호 입력 폼',
      options: [
        { id: 'email', name: '이메일 로그인', level: 2, spec: '아이디·비밀번호 로그인' },
        { id: 'social', name: '소셜 로그인', level: 3, spec: '카카오·네이버·구글 간편 로그인' },
        { id: 'find', name: '비밀번호 찾기', level: 2, spec: '이메일 인증 기반 재설정' },
        { id: 'agree', name: '약관 동의', level: 1, spec: '가입 시 필수·선택 약관 동의' }
      ]
    },
    footer: {
      group: '구조', name: '하단 정보 영역', level: 1, span: 12, rows: 2,
      hint: '법적 고지와 채널',
      fallback: '회사명과 연락처만 있는 하단',
      options: [
        { id: 'sns', name: 'SNS 링크', level: 1, spec: '인스타그램·블로그 등 외부 채널 연결' },
        { id: 'legal', name: '약관·개인정보', level: 1, spec: '이용약관·개인정보처리방침 링크' },
        { id: 'biz', name: '사업자 정보', level: 1, spec: '상호·대표·사업자번호·주소 표기' },
        { id: 'news', name: '소식 구독', level: 2, spec: '이메일 주소를 받아 구독 목록에 저장' }
      ]
    },
    text: {
      group: '콘텐츠', name: '본문 텍스트', level: 1, span: 6, rows: 2,
      hint: '설명할 내용의 양',
      fallback: '제목과 문단으로 된 본문',
      options: [
        { id: 'rich', name: '서식 있는 본문', level: 1, spec: '제목·문단·목록이 있는 본문 영역' },
        { id: 'image', name: '본문 이미지', level: 1, spec: '문단 사이에 삽입되는 이미지' },
        { id: 'video', name: '동영상 삽입', level: 2, spec: '유튜브·비메오 영상 임베드' }
      ]
    }
  };

  var GROUPS = ['전환', '기능', '콘텐츠', '구조'];

  /* ── 업종 템플릿 6종 ─────────────────────────────────────────── */
  var TEMPLATES = {
    clinic: {
      name: '병원·예약형', desc: '예약 모듈 포함', blocks: [
        { type: 'hero', label: '진료 안내', options: ['tel', 'scroll'] },
        { type: 'text', label: '진료 과목', options: ['rich'] },
        { type: 'booking', label: '진료 예약', options: ['date', 'capacity'] },
        { type: 'map', label: '오시는 길', options: ['embed', 'hours'] },
        { type: 'contact', label: '상담 문의', options: ['db', 'alimtalk'] },
        { type: 'footer', label: '병원 정보', options: ['biz', 'legal'] }
      ]
    },
    company: {
      name: '회사 소개형', desc: '조직·실적 중심', blocks: [
        { type: 'hero', label: '회사 소개', options: ['scroll'] },
        { type: 'text', label: '사업 영역', options: ['rich', 'image'] },
        { type: 'gallery', label: '현장 사진', options: ['slider'] },
        { type: 'team', label: '구성원', options: ['profile'] },
        { type: 'contact', label: '프로젝트 문의', options: ['mail', 'db'] },
        { type: 'footer', label: '회사 정보', options: ['biz', 'sns'] }
      ]
    },
    shop: {
      name: '쇼핑몰·상품형', desc: '가격표·결제', blocks: [
        { type: 'hero', label: '신상품 배너', options: ['banner', 'link'] },
        { type: 'pricing', label: '상품 가격표', options: ['table', 'cart'] },
        { type: 'gallery', label: '상품 사진', options: ['lightbox'] },
        { type: 'faq', label: '배송·교환 안내', options: ['accordion'] },
        { type: 'contact', label: '주문 문의', options: ['mail'] },
        { type: 'footer', label: '판매자 정보', options: ['legal', 'biz'] }
      ]
    },
    academy: {
      name: '학원·교육형', desc: '커리큘럼·수강료', blocks: [
        { type: 'hero', label: '수강 신청', options: ['link', 'scroll'] },
        { type: 'text', label: '커리큘럼', options: ['rich'] },
        { type: 'pricing', label: '수강료', options: ['table'] },
        { type: 'board', label: '수강 후기', options: ['notice', 'filter'] },
        { type: 'contact', label: '상담 신청', options: ['db', 'attach'] },
        { type: 'footer', label: '학원 정보', options: ['legal'] }
      ]
    },
    cafe: {
      name: '카페·매장형', desc: '사진·오시는 길', blocks: [
        { type: 'hero', label: '시즌 메뉴', options: ['scroll'] },
        { type: 'gallery', label: '매장 사진', options: ['album'] },
        { type: 'map', label: '오시는 길', options: ['embed', 'hours'] },
        { type: 'faq', label: '이용 안내', options: ['accordion'] },
        { type: 'footer', label: '매장 정보', options: ['sns', 'biz'] }
      ]
    },
    studio: {
      name: '1인 사업·포트폴리오', desc: '작업물·문의', blocks: [
        { type: 'hero', label: '작업 소개', options: ['scroll'] },
        { type: 'gallery', label: '포트폴리오', options: ['slider', 'lightbox'] },
        { type: 'text', label: '작업 방식', options: ['rich'] },
        { type: 'contact', label: '제작 문의', options: ['mail', 'attach'] },
        { type: 'footer', label: '연락처', options: ['sns', 'legal'] }
      ]
    }
  };

  global.DY = global.DY || {};
  global.DY.LEVELS = LEVELS;
  global.DY.COST = COST;
  global.DY.TYPES = TYPES;
  global.DY.GROUPS = GROUPS;
  global.DY.TEMPLATES = TEMPLATES;
})(window);
