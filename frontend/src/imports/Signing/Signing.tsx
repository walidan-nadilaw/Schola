import imgHeader from "./fb4b976284f353796ffb0e836979232591a38ec0.png";

function Header1() {
  return (
    <div className="h-[59.5px] relative shrink-0 w-full" data-name="Header">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgHeader} />
    </div>
  );
}

function Link() {
  return (
    <div className="absolute content-stretch flex flex-col h-[59.5px] items-start left-[198px] top-[38px] w-[163px]" data-name="Link">
      <Header1 />
    </div>
  );
}

function Link1() {
  return (
    <div className="h-[20.531px] relative shrink-0 w-[57.797px]" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[20.529px] left-0 text-[#828282] text-[13.686px] top-[-1px] whitespace-nowrap">Verifikasi</p>
      </div>
    </div>
  );
}

function Link2() {
  return (
    <div className="h-[20.531px] relative shrink-0 w-[56.547px]" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[20.529px] left-0 text-[#828282] text-[13.686px] top-[-1px] whitespace-nowrap">Panduan</p>
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="flex-[1_0_0] h-[20.531px] min-w-px relative" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[20.529px] left-0 text-[#828282] text-[13.686px] top-[-1px] whitespace-nowrap">Pengajuan</p>
      </div>
    </div>
  );
}

function Navigation() {
  return (
    <div className="absolute content-stretch flex gap-[45px] h-[20.531px] items-start left-[847px] top-[59px] w-[272.641px]" data-name="Navigation">
      <Link1 />
      <Link2 />
      <Link3 />
    </div>
  );
}

function Button() {
  return (
    <div className="absolute bg-[#007bff] h-[35px] left-[1137px] rounded-[5px] top-[50px] w-[104px]" data-name="Button">
      <p className="-translate-x-1/2 absolute font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[20.529px] left-[52.23px] text-[13.686px] text-center text-white top-[7.5px] whitespace-nowrap">Sign In</p>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[135px] relative shrink-0 w-full" data-name="Container">
      <Link />
      <Navigation />
      <Button />
    </div>
  );
}

function Header() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[136px] items-start left-0 pb-px px-[47px] top-0 w-[1534px]" data-name="Header">
      <div aria-hidden="true" className="absolute border-[#f3f4f6] border-b border-solid inset-0 pointer-events-none" />
      <Container />
    </div>
  );
}

function ImageScholaLogo() {
  return (
    <div className="h-[64px] relative shrink-0 w-[175.313px]" data-name="Image (Schola Logo)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full" src={imgHeader} />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex h-[64px] items-start justify-center left-[32px] px-[104.344px] top-[32px] w-[384px]" data-name="Container">
      <ImageScholaLogo />
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute h-[42px] left-[32px] top-[128px] w-[384px]" data-name="Heading 1">
      <p className="-translate-x-1/2 absolute font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[42px] left-[192.03px] text-[28px] text-black text-center top-0 whitespace-nowrap">Selamat Datang</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[24px] left-[32px] top-[178px] w-[384px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-[192.25px] not-italic text-[#4a5565] text-[16px] text-center top-[-2px] whitespace-nowrap">Masuk ke Schola: IPB Academic Help Center</p>
    </div>
  );
}

function Label() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Label">
      <p className="absolute font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[24px] left-0 text-[16px] text-black top-[-1px] whitespace-nowrap">Email IPB</p>
    </div>
  );
}

function EmailInput() {
  return (
    <div className="h-[50px] relative rounded-[10px] shrink-0 w-full" data-name="Email Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[16px] text-[rgba(10,10,10,0.5)] whitespace-nowrap">nama@apps.ipb.ac.id</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[10px]" />
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[82px] items-start relative shrink-0 w-full" data-name="Container">
      <Label />
      <EmailInput />
    </div>
  );
}

function Label1() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Label">
      <p className="absolute font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[24px] left-0 text-[16px] text-black top-[-1px] whitespace-nowrap">Password</p>
    </div>
  );
}

function PasswordInput() {
  return (
    <div className="h-[50px] relative rounded-[10px] shrink-0 w-full" data-name="Password Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[16px] text-[rgba(10,10,10,0.5)] whitespace-nowrap">Masukkan password</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[10px]" />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[82px] items-start relative shrink-0 w-full" data-name="Container">
      <Label1 />
      <PasswordInput />
    </div>
  );
}

function Checkbox() {
  return <div className="relative shrink-0 size-[13px]" data-name="Checkbox" />;
}

function Text() {
  return (
    <div className="flex-[1_0_0] h-[20px] min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[#4a5565] text-[14px] whitespace-nowrap">Ingat saya</p>
      </div>
    </div>
  );
}

function Label2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[85.672px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Checkbox />
        <Text />
      </div>
    </div>
  );
}

function Link4() {
  return (
    <div className="h-[20px] relative shrink-0 w-[98.656px]" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#007bff] text-[14px] whitespace-nowrap">Lupa password?</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex h-[20px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Label2 />
      <Link4 />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#007bff] h-[48px] relative rounded-[10px] shrink-0 w-full" data-name="Button">
      <p className="-translate-x-1/2 absolute font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[24px] left-[191.69px] text-[16px] text-center text-white top-[11px] whitespace-nowrap">Masuk</p>
    </div>
  );
}

function Form() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] h-[304px] items-start left-[32px] top-[234px] w-[384px]" data-name="Form">
      <Container3 />
      <Container4 />
      <Container5 />
      <Button1 />
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex h-[20px] items-start left-[32px] top-[562px] w-[384px]" data-name="Container">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[20px] min-w-px not-italic relative text-[#4a5565] text-[14px] text-center">Gunakan akun IPB yang sama dengan portal akademik</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="content-stretch flex h-[20px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[0] min-w-px not-italic relative text-[#4a5565] text-[14px] text-center">
        <span className="leading-[20px]">{`Belum punya akun? `}</span>
        <span className="leading-[20px] text-[#007bff]">Hubungi admin</span>
      </p>
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute content-stretch flex flex-col h-[45px] items-start left-[32px] pt-[25px] top-[614px] w-[384px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-solid border-t inset-0 pointer-events-none" />
      <Paragraph1 />
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-white drop-shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] h-[691px] relative rounded-[10px] shrink-0 w-[448px]" data-name="Container">
      <Container2 />
      <Heading />
      <Paragraph />
      <Form />
      <Container6 />
      <Container7 />
    </div>
  );
}

function MainContent() {
  return (
    <div className="absolute bg-[#f9fafb] content-stretch flex h-[990px] items-center justify-center left-0 px-[543px] py-[48px] top-[136px] w-[1534px]" data-name="Main Content">
      <Container1 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[20.531px] relative shrink-0 w-[326.297px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[20.529px] left-0 text-[#828282] text-[13.686px] top-[-1px] whitespace-nowrap">Copyright 2026 Schola: IPB Academic Help Center</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[135px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pl-[556.844px] pr-[556.859px] relative size-full">
          <Paragraph2 />
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[136px] items-start left-0 pt-px px-[47px] top-[1126px] w-[1534px]" data-name="Footer">
      <div aria-hidden="true" className="absolute border-[#f3f4f6] border-solid border-t inset-0 pointer-events-none" />
      <Container8 />
    </div>
  );
}

function Root() {
  return (
    <div className="bg-white h-[1262px] relative shrink-0 w-full" data-name="Root">
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
}

function Body() {
  return (
    <div className="content-stretch flex flex-col h-[990px] items-start relative shrink-0 w-full" data-name="Body">
      <Root />
    </div>
  );
}

export default function Signing() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full" data-name="Signing">
      <Body />
    </div>
  );
}