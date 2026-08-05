# 목업 엑셀(v8) 리뷰 시트 -> prisma/seed-data/reviews.json 생성기
#
# 시드를 돌릴 때는 필요 없다. 이미 생성된 reviews.json이 커밋돼 있으므로
# `pnpm seed:reviews` 만 실행하면 된다.
# 이 스크립트는 **목업 엑셀이 갱신됐을 때 JSON을 다시 만드는 용도**다.
#
#   준비:  pip install openpyxl
#   실행:  python prisma/seed-data/generate-reviews-from-xlsx.py <목업엑셀.xlsx>

import openpyxl, json, os, sys, collections

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
XLSX = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE_DIR, "PICDAY_목업데이터_v8.xlsx")
OUT = os.path.join(BASE_DIR, "reviews.json")
SHEET = "리뷰 목업 데이터"

BUCKET = "picday-images-681447159066-ap-northeast-2-an"
REGION = "ap-northeast-2"
PREFIX = "review"

# 엑셀 태그 라벨 -> ReviewKeyword ENUM
TAG_TO_ENUM = {
    "친절한 응대": "KIND_SERVICE",
    "꼼꼼한 보정": "DETAILED_RETOUCH",
    "시간 엄수": "ON_TIME",
    "편안한 분위기": "COMFORTABLE_MOOD",
    "합리적인 가격": "REASONABLE_PRICE",
    "만족스러운 결과물": "SATISFYING_RESULT",
}

# 촬영종류 -> 상품명 접두어 (studios.json의 상품명과 매칭)
SHOOTING_TO_PRODUCT_PREFIX = {
    "증명": "증명",
    "여권": "여권",
    "프로필": "프로필",
    "개인화보": "개인화보",
    "취업": "취업",
    "가족": "가족",
    "우정": "우정",
}

if not os.path.exists(XLSX):
    sys.exit(f"목업 엑셀을 찾을 수 없습니다: {XLSX}")

ws = openpyxl.load_workbook(XLSX, data_only=True)[SHEET]
rows = list(ws.iter_rows(min_row=1, values_only=True))
H = {h: i for i, h in enumerate(rows[0])}
data = [r for r in rows[1:] if r[0]]
g = lambda r, k: r[H[k]]


def split_csv(value):
    if not value:
        return []
    return [v.strip() for v in str(value).split(",") if v.strip()]


reviews = []
unknown_tags, unknown_kinds = set(), set()

for r in data:
    tags = []
    for label in split_csv(g(r, "선택태그")):
        enum = TAG_TO_ENUM.get(label)
        if enum:
            if enum not in tags:
                tags.append(enum)
        else:
            unknown_tags.add(label)

    kind = str(g(r, "촬영종류")).strip()
    prefix = SHOOTING_TO_PRODUCT_PREFIX.get(kind)
    if not prefix:
        unknown_kinds.add(kind)

    images = [
        f"https://{BUCKET}.s3.{REGION}.amazonaws.com/{PREFIX}/{name.replace('.png', '.jpg')}"
        for name in split_csv(g(r, "첨부파일명(영문)"))
    ]

    reviews.append({
        "reviewExcelId": g(r, "리뷰ID"),
        "studioExcelId": g(r, "사진관ID"),
        "nickname": g(r, "작성자닉네임"),
        "rating": int(g(r, "별점")),
        # 예약할 상품을 고르는 기준 (studios.json 상품명 접두어)
        "productPrefix": prefix,
        # YYYY-MM-DD. 리뷰 작성일이자 촬영일 기준
        "writtenAt": str(g(r, "작성일"))[:10],
        "content": str(g(r, "리뷰본문")).strip(),
        "keywords": tags,
        "imageUrls": images,
        "likeCount": int(g(r, "도움돼요수") or 0),
    })

with open(OUT, "w", encoding="utf-8") as fp:
    json.dump(reviews, fp, ensure_ascii=False, indent=2)

# ---------- 검증 ----------
by_studio = collections.Counter(x["studioExcelId"] for x in reviews)
print(f"리뷰        : {len(reviews)}")
print(f"사진관      : {len(by_studio)}  (사진관당 {min(by_studio.values())}~{max(by_studio.values())}개)")
print(f"닉네임 고유  : {len(set(x['nickname'] for x in reviews))}")
print(f"이미지 첨부  : {sum(len(x['imageUrls']) for x in reviews)}건 / 고유 파일 {len(set(u for x in reviews for u in x['imageUrls']))}장")
print(f"태그        : {sum(len(x['keywords']) for x in reviews)}건")
print(f"도움돼요 합계: {sum(x['likeCount'] for x in reviews)}")
print(f"별점 분포    : {dict(sorted(collections.Counter(x['rating'] for x in reviews).items()))}")
print(f"작성일 범위  : {min(x['writtenAt'] for x in reviews)} ~ {max(x['writtenAt'] for x in reviews)}")
if unknown_tags:
    print(f"⚠️ 매핑 안 된 태그: {unknown_tags}")
if unknown_kinds:
    print(f"⚠️ 매핑 안 된 촬영종류: {unknown_kinds}")
print(f"\n생성: {OUT}")
