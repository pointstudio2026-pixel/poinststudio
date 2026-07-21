-- 이미지 수정에 자유 텍스트(대화형) 입력을 지원하기 위해 preset_key를
-- nullable로 바꾸고, custom_instruction 컬럼을 추가한다. 생성 시점에 애플리
-- 케이션 레벨(CreateEditUseCase)에서 둘 중 정확히 하나만 채워지도록 강제한다.
ALTER TABLE "edit_history" ALTER COLUMN "preset_key" DROP NOT NULL;
ALTER TABLE "edit_history" ADD COLUMN "custom_instruction" TEXT;
