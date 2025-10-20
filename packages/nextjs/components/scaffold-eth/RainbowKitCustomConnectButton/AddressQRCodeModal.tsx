import { Dispatch, SetStateAction } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Address as AddressType } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~~/components/ui/shadcn/dialog";

type AddressQRCodeModalProps = {
  address: AddressType;
  showQr: boolean;
  setShowQr: Dispatch<SetStateAction<boolean>>;
};

export const AddressQRCodeModal = ({ address, showQr, setShowQr }: AddressQRCodeModalProps) => {
  return (
    <Dialog open={showQr} onOpenChange={open => setShowQr(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your QR code</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-6">
          <div className="flex flex-col items-center gap-6">
            <QRCodeSVG value={address} size={256} />
            <Address address={address} format="long" disableAddressLink onlyEnsOrAddress />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
