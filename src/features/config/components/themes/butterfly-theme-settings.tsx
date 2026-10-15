import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { AssetUploadField } from "@/features/config/components/asset-upload-field";
import { Field } from "@/features/config/components/site-settings-fields";
import type { SystemConfig } from "@/features/config/config.schema";
import { isButterfly } from "@/lib/theme-mode";
import { m } from "@/paraglide/messages";

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function ButterflyPrimaryPreview() {
  const { control } = useFormContext<SystemConfig>();
  const current = useWatch({
    control,
    name: "site.theme.butterfly.primaryColor",
  });

  const primary =
    typeof current === "string" && HEX_COLOR_REGEX.test(current)
      ? current
      : "#1c69ed";

  return (
    <div
      className="rounded-2xl border border-border/40 p-4 md:col-span-2"
      style={
        {
          "--butterfly-theme": primary,
          "--butterfly-primary": primary,
        } as React.CSSProperties
      }
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            {m.settings_site_primary_preview_title()}
          </p>
          <p className="text-xs text-muted-foreground">
            {m.settings_site_butterfly_preview_desc({ color: primary })}
          </p>
        </div>
        <div
          className="h-10 w-10 shrink-0 rounded-xl border border-black/10 shadow-sm"
          style={{ backgroundColor: "var(--butterfly-theme)" }}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="butterfly-card-base border border-black/5 p-4">
          <div
            className="h-2.5 w-16 rounded-full"
            style={{ backgroundColor: "var(--butterfly-theme)" }}
          />
          <p className="mt-4 text-xs/5 font-medium butterfly-text-50">
            {m.settings_site_primary_preview_card_label()}
          </p>
          <p className="mt-1 text-lg font-semibold butterfly-text-90">
            {m.settings_site_primary_preview_card_title()}
          </p>
          <p className="mt-2 text-sm butterfly-text-75">
            {m.settings_site_butterfly_preview_card_desc()}
          </p>
        </div>

        <button
          type="button"
          className="butterfly-btn-primary h-11 rounded-[8px] px-4 text-sm font-semibold active:scale-[0.98]"
          style={{ backgroundColor: primary, color: "#ffffff" }}
        >
          {m.settings_site_primary_preview_btn_primary()}
        </button>

        <button
          type="button"
          className="butterfly-btn-regular h-11 rounded-[8px] px-4 text-sm font-medium active:scale-[0.98]"
        >
          {m.settings_site_primary_preview_btn_tinted()}
        </button>
      </div>
    </div>
  );
}

/**
 * Butterfly 主题专属设置：首屏大图 / 内页横幅 / 头像 / 主色
 */
export function ButterflyThemeSettings() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SystemConfig>();

  const homeBgField = (
    <div className="sm:col-span-2">
      <AssetUploadField
        name="site.theme.butterfly.homeBg"
        assetPath="themes/butterfly/home-bg.webp"
        accept=".png,.webp,.jpg,.jpeg"
        label={m.settings_site_field_home_image()}
        hint={m.settings_site_field_home_image_hint()}
        placeholder="/images/asset/themes/butterfly/home-bg.webp or https://picsum.photos/1600/900"
        error={errors.site?.theme?.butterfly?.homeBg?.message}
      />
    </div>
  );

  const pageBgField = (
    <div className="sm:col-span-2">
      <AssetUploadField
        name="site.theme.butterfly.pageBg"
        assetPath="themes/butterfly/page-bg.webp"
        accept=".png,.webp,.jpg,.jpeg"
        label={m.settings_site_field_page_image()}
        hint={m.settings_site_field_page_image_hint()}
        placeholder="/images/asset/themes/butterfly/page-bg.webp or https://picsum.photos/1600/900"
        error={errors.site?.theme?.butterfly?.pageBg?.message}
      />
    </div>
  );

  const avatarField = (
    <AssetUploadField
      name="site.theme.butterfly.avatar"
      assetPath="themes/butterfly/avatar.png"
      accept=".png,.webp,.jpg,.jpeg"
      readOnly
      label={m.settings_site_field_avatar()}
      error={errors.site?.theme?.butterfly?.avatar?.message}
    />
  );

  const primaryColorField = (
    <>
      <Field
        label={m.settings_site_field_primary_color()}
        hint={m.settings_site_field_primary_color_hint()}
        error={errors.site?.theme?.butterfly?.primaryColor?.message}
      >
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label={m.settings_site_field_primary_color()}
            defaultValue="#1c69ed"
            className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border/50 bg-transparent p-1"
            {...register("site.theme.butterfly.primaryColor")}
          />
          <Input
            placeholder="#1c69ed"
            {...register("site.theme.butterfly.primaryColor")}
          />
        </div>
      </Field>
      <ButterflyPrimaryPreview />
    </>
  );

  if (isButterfly) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {homeBgField}
        {pageBgField}
        {avatarField}
        {primaryColorField}
      </div>
    );
  }

  return (
    <>
      {homeBgField}
      {pageBgField}
      {avatarField}
      {primaryColorField}
    </>
  );
}
